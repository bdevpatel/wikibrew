#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execFileSync } = require("child_process");
const { version } = require("./package.json");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PROJECT_NAME = "my-wiki";

const AGENTS = [
  { key: "copilot",  label: "VS Code Copilot",  file: ".github/copilot-instructions.md" },
  { key: "claude",   label: "Claude Code",       file: "CLAUDE.md" },
  { key: "codex",    label: "Codex",             file: "AGENTS.md" },
  { key: "cursor",   label: "Cursor",            file: ".cursor/rules/wikibrew.mdc" },
  { key: "gemini",   label: "Gemini CLI",        file: "GEMINI.md" },
];

const CLI_TOOLS = [
  {
    key: "summarize",
    label: "summarize",
    desc: "Summarize links, files, and media from the CLI",
    install: "npm i -g @steipete/summarize",
    verify: "summarize",
  },
  {
    key: "qmd",
    label: "qmd",
    desc: "Local markdown search engine (BM25 + vector + re-rank)",
    install: "npm i -g @tobilu/qmd",
    verify: "qmd",
  },
  {
    key: "agent-browser",
    label: "agent-browser",
    desc: "Browser automation for web research",
    install: "npm i -g agent-browser",
    postInstall: "agent-browser install",
    verify: "agent-browser",
  },
];

const SAFE_FILES = new Set([
  ".ds_store",
  ".git",
  ".gitattributes",
  ".gitignore",
  ".hg",
  ".idea",
  ".npmignore",
  ".vscode",
  "license",
  "licence",
  "readme.md",
  "thumbs.db",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function templateDir() {
  return path.join(__dirname, "template");
}

function isFolderSafe(dir) {
  const conflicts = [];
  for (const entry of fs.readdirSync(dir)) {
    if (!SAFE_FILES.has(entry.toLowerCase())) {
      conflicts.push(entry);
    }
  }
  return { safe: conflicts.length === 0, conflicts };
}

function quoteForShell(value) {
  if (process.platform === "win32") {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function copyDirSync(src, dest, filter) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (filter && !filter(srcPath, entry.name)) continue;
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, filter);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function commandExists(cmd) {
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", [cmd], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

function detectAgents() {
  const detected = [];
  const env = process.env;

  // VS Code terminal
  if (env.TERM_PROGRAM === "vscode" || env.VSCODE_PID) {
    detected.push("copilot");
  }

  // Walk up parent dirs looking for agent config files
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, "CLAUDE.md")))  detected.push("claude");
    if (fs.existsSync(path.join(dir, "AGENTS.md")))  detected.push("codex");
    if (fs.existsSync(path.join(dir, "GEMINI.md")))  detected.push("gemini");
    if (fs.existsSync(path.join(dir, ".cursor")))     detected.push("cursor");
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return [...new Set(detected)];
}

// ---------------------------------------------------------------------------
// Interactive prompts (zero-dependency readline)
// ---------------------------------------------------------------------------

function createPrompter() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function ask(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer.trim()));
    });
  }

  async function confirm(question, defaultYes = true) {
    const hint = defaultYes ? "[Y/n]" : "[y/N]";
    const answer = await ask(`${question} ${hint} `);
    if (!answer) return defaultYes;
    return answer.toLowerCase().startsWith("y");
  }

  async function selectMultiple(header, items, defaults = []) {
    console.log("");
    console.log(header);
    console.log("");
    for (let i = 0; i < items.length; i++) {
      const def = defaults.includes(items[i].key) ? " (auto-detected)" : "";
      console.log(`  ${i + 1}. ${items[i].label}  → ${items[i].file || items[i].desc}${def}`);
    }
    console.log("");
    const defaultStr = defaults.length
      ? defaults.map((d) => items.findIndex((it) => it.key === d) + 1).filter((n) => n > 0).join(",")
      : "";
    const hint = defaultStr ? ` [default: ${defaultStr}]` : "";
    const answer = await ask(`Enter numbers separated by commas, 'all', or 'none'${hint}: `);

    if (!answer && defaultStr) {
      return defaults;
    }
    if (!answer || answer.toLowerCase() === "none") return [];
    if (answer.toLowerCase() === "all") return items.map((it) => it.key);

    const nums = answer.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    return nums
      .filter((n) => n >= 1 && n <= items.length)
      .map((n) => items[n - 1].key);
  }

  function close() {
    rl.close();
  }

  return { ask, confirm, selectMultiple, close };
}

// ---------------------------------------------------------------------------
// Scaffolding logic
// ---------------------------------------------------------------------------

function scaffold(targetDir, options) {
  const {
    selectedAgents = [],
    domain = "",
    projectName = "",
  } = options;

  const tplDir = templateDir();

  // Determine which agent files to skip
  const allAgentFiles = AGENTS.map((a) => a.file);
  const selectedAgentFiles = new Set(
    selectedAgents.map((key) => AGENTS.find((a) => a.key === key)?.file).filter(Boolean)
  );

  // Copy template, skipping unselected agent config files
  copyDirSync(tplDir, targetDir, (srcPath, name) => {
    // Skip .DS_Store, Thumbs.db
    if (name === ".DS_Store" || name === "Thumbs.db") return false;

    // Check if this is an agent config file that wasn't selected
    const relPath = path.relative(tplDir, srcPath).replace(/\\/g, "/");
    if (allAgentFiles.includes(relPath) && !selectedAgentFiles.has(relPath)) {
      return false;
    }

    // Skip .cursor directory entirely if cursor not selected
    if (relPath.startsWith(".cursor") && !selectedAgents.includes("cursor")) {
      return false;
    }

    // Skip .github directory if copilot not selected (but keep it if it exists for other reasons)
    if (relPath === ".github/copilot-instructions.md" && !selectedAgents.includes("copilot")) {
      return false;
    }

    return true;
  });

  // Remove empty .github dir if copilot not selected and dir is empty
  const ghDir = path.join(targetDir, ".github");
  if (fs.existsSync(ghDir)) {
    const entries = fs.readdirSync(ghDir);
    if (entries.length === 0) {
      fs.rmSync(ghDir, { recursive: true });
    }
  }

  // Pre-fill overview.md if domain provided
  if (domain) {
    const overviewPath = path.join(targetDir, "wiki", "overview.md");
    if (fs.existsSync(overviewPath)) {
      const content = `# Overview\n\nThis knowledge base covers **${domain}** — tracking sources, key entities, emerging concepts, and evolving understanding.\n\n## Key Questions\n\n- (Add your research questions here)\n\n## Scope\n\n- (Define what's in and out of scope)\n`;
      fs.writeFileSync(overviewPath, content, "utf8");
    }
  }

  // Update project-level README with the wiki name
  const readmePath = path.join(targetDir, "README.md");
  if (fs.existsSync(readmePath) && projectName) {
    let readme = fs.readFileSync(readmePath, "utf8");
    readme = readme.replace(/\{\{WIKI_NAME\}\}/g, projectName);
    readme = readme.replace(/\{\{DOMAIN\}\}/g, domain || "general-purpose knowledge base");
    fs.writeFileSync(readmePath, readme, "utf8");
  }
}

function initGit(targetDir) {
  try {
    execFileSync("git", ["init", "--quiet"], {
      cwd: targetDir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    execFileSync("git", ["add", "."], {
      cwd: targetDir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    execFileSync("git", ["commit", "-m", "Initial wikibrew scaffold", "--quiet"], {
      cwd: targetDir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

function installTool(tool) {
  try {
    console.log(`  Installing ${tool.label}...`);
    execFileSync("npm", ["i", "-g", ...tool.install.split(" ").slice(3)], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
    if (tool.postInstall) {
      execFileSync(tool.postInstall.split(" ")[0], tool.postInstall.split(" ").slice(1), {
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
      });
    }
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function printHelp() {
  console.log("");
  console.log("  wikibrew — scaffold an LLM-maintained knowledge base");
  console.log("");
  console.log("  Usage:");
  console.log("    wikibrew [project-name] [options]");
  console.log("");
  console.log("  Options:");
  console.log("    --agents <list>      Comma-separated: copilot,claude,codex,cursor,gemini,all,none");
  console.log("    --domain <text>      Wiki topic (e.g. \"AI research\", \"personal finance\")");
  console.log("    --git                Initialize a git repository (default in interactive mode)");
  console.log("    --no-git             Skip git initialization");
  console.log("    --no-tools           Skip CLI tool installation prompts");
  console.log("    -h, --help           Show this help");
  console.log("    -v, --version        Show version");
  console.log("");
  console.log("  Examples:");
  console.log("    npx wikibrew my-wiki");
  console.log("    npx wikibrew my-wiki --agents copilot,claude --domain \"AI research\"");
  console.log("    npx wikibrew . --agents all --git");
  console.log("");
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = {
    action: "create",
    projectName: null,
    agents: null,       // null = interactive; array = from flag
    domain: null,       // null = interactive; string = from flag
    git: null,          // null = interactive; true/false = from flag
    noTools: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") return { action: "help" };
    if (arg === "-v" || arg === "--version") return { action: "version" };
    if (arg === "--git") { parsed.git = true; continue; }
    if (arg === "--no-git") { parsed.git = false; continue; }
    if (arg === "--no-tools") { parsed.noTools = true; continue; }

    if (arg === "--agents") {
      const val = args[++i];
      if (!val) { console.error("Error: --agents requires a value."); process.exit(1); }
      if (val === "all") {
        parsed.agents = AGENTS.map((a) => a.key);
      } else if (val === "none") {
        parsed.agents = [];
      } else {
        parsed.agents = val.split(",").map((s) => s.trim().toLowerCase());
        const valid = new Set(AGENTS.map((a) => a.key));
        for (const a of parsed.agents) {
          if (!valid.has(a)) {
            console.error(`Error: unknown agent "${a}". Valid: ${[...valid].join(", ")}, all, none`);
            process.exit(1);
          }
        }
      }
      continue;
    }

    if (arg === "--domain") {
      parsed.domain = args[++i];
      if (!parsed.domain) { console.error("Error: --domain requires a value."); process.exit(1); }
      continue;
    }

    if (arg.startsWith("-")) {
      console.error(`Error: unknown option: ${arg}`);
      process.exit(1);
    }

    if (parsed.projectName !== null) {
      console.error("Error: expected at most one project name.");
      process.exit(1);
    }
    parsed.projectName = arg;
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const parsed = parseArgs(process.argv);

  if (parsed.action === "help") { printHelp(); return; }
  if (parsed.action === "version") { console.log(version); return; }

  const isInteractive = process.stdin.isTTY && parsed.agents === null;
  let prompt;
  if (isInteractive) {
    prompt = createPrompter();
  }

  try {
    // ---- Project name ----
    let projectName = parsed.projectName;
    if (!projectName && isInteractive) {
      projectName = await prompt.ask(`Wiki name [${DEFAULT_PROJECT_NAME}]: `) || DEFAULT_PROJECT_NAME;
    }
    projectName = projectName || DEFAULT_PROJECT_NAME;

    if (projectName !== "." && (projectName.includes("/") || projectName.includes("\\"))) {
      console.error("Error: project name must be a single directory name or '.'");
      process.exit(1);
    }

    const isCurrentDir = projectName === ".";
    const targetDir = path.resolve(process.cwd(), projectName);
    const displayName = isCurrentDir ? "." : projectName;
    const finalName = isCurrentDir ? path.basename(targetDir) : projectName;

    // Check target directory
    if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
      const { safe, conflicts } = isFolderSafe(targetDir);
      if (!safe) {
        console.error(`\nError: directory ${displayName} contains files that could conflict:\n`);
        for (const file of conflicts) console.error(`  ${file}`);
        console.error("\nEither use a new directory name, or remove these files first.");
        process.exit(1);
      }
    } else if (fs.existsSync(targetDir)) {
      console.error(`Error: ${displayName} exists and is not a directory.`);
      process.exit(1);
    }

    // ---- Agent selection ----
    let selectedAgents = parsed.agents;
    if (selectedAgents === null) {
      if (isInteractive) {
        const detected = detectAgents();
        const agentItems = AGENTS.map((a) => ({
          key: a.key,
          label: a.label,
          file: a.file,
        }));
        selectedAgents = await prompt.selectMultiple(
          "Which AI agents do you use?",
          agentItems,
          detected
        );
      } else {
        selectedAgents = AGENTS.map((a) => a.key); // non-interactive default: all
      }
    }

    // ---- Domain ----
    let domain = parsed.domain;
    if (domain === null && isInteractive) {
      console.log("");
      domain = await prompt.ask(
        'What\'s this wiki about? (e.g. "AI research", "personal finance",\n' +
        '  "reading Lord of the Rings", "competitive analysis on fintech")\n' +
        "  This helps set up your wiki's focus. Leave blank for general-purpose.\n> "
      );
    }
    domain = domain || "";

    // ---- CLI tools ----
    let selectedTools = [];
    if (!parsed.noTools && isInteractive) {
      const toolItems = CLI_TOOLS.map((t) => ({
        key: t.key,
        label: t.label,
        desc: t.desc,
      }));
      selectedTools = await prompt.selectMultiple(
        "Install CLI tools? (recommended — these extend what the LLM can do)",
        toolItems,
        []
      );
    }

    // ---- Git ----
    let doGit = parsed.git;
    if (doGit === null && isInteractive) {
      console.log("");
      console.log("Initialize a git repository?");
      console.log("  Git tracks every change the LLM makes to your wiki — so you can:");
      console.log("  • Undo any bad edit instantly (git checkout)");
      console.log("  • See full history of what changed and when (git log)");
      console.log("  • Branch for risky experiments, merge if they work");
      console.log("  • Push to GitHub for backup or collaboration");
      console.log("");
      doGit = await prompt.confirm("Initialize git?", true);
    }

    // ---- Execute scaffolding ----
    console.log("");
    console.log("Creating wiki structure...");

    scaffold(targetDir, {
      selectedAgents,
      domain,
      projectName: finalName,
    });

    // Count created files
    let fileCount = 0;
    function countFiles(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === ".git") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) countFiles(full);
        else fileCount++;
      }
    }
    countFiles(targetDir);

    const agentFiles = selectedAgents
      .map((key) => AGENTS.find((a) => a.key === key)?.file)
      .filter(Boolean);

    console.log(`✔ Created ${fileCount} files in ${displayName}/`);
    if (agentFiles.length) {
      console.log(`✔ Agent configs: ${agentFiles.join(", ")}`);
    } else {
      console.log("✔ No agent configs (use --agents to add later)");
    }

    // ---- Install tools ----
    for (const toolKey of selectedTools) {
      const tool = CLI_TOOLS.find((t) => t.key === toolKey);
      if (tool) {
        const ok = installTool(tool);
        if (ok) {
          console.log(`✔ Installed ${tool.label}`);
        } else {
          console.log(`⚠ Failed to install ${tool.label} — run manually: ${tool.install}`);
        }
      }
    }

    // ---- Git init ----
    if (doGit) {
      if (commandExists("git")) {
        const ok = initGit(targetDir);
        if (ok) {
          console.log("✔ Initialized git repository");
        } else {
          console.log("⚠ git init failed — you can run it manually later");
        }
      } else {
        console.log("⚠ git not found in PATH. Skipping repository initialization.");
        console.log("  Tip: Install git (https://git-scm.com) to track wiki changes over time.");
      }
    }

    // ---- Print next steps ----
    console.log("");
    console.log("Next steps:");
    if (!isCurrentDir) {
      console.log(`  cd ${quoteForShell(finalName)}`);
    }
    console.log("  Open the folder in Obsidian (or any markdown editor)");
    console.log("  Install the Obsidian Web Clipper browser extension:");
    console.log("    https://chromewebstore.google.com/detail/obsidian-web-clipper/cnjifjpddelmedmihgijeibhnjfabmlf");
    console.log("  Clip your first article into raw/sources/");

    if (selectedAgents.length) {
      const primaryAgent = selectedAgents[0];
      const primaryFile = AGENTS.find((a) => a.key === primaryAgent)?.file;
      console.log(`  Then ask your LLM: "Read ${primaryFile} and ingest the new source"`);
    }

    console.log("");
  } finally {
    if (prompt) prompt.close();
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
