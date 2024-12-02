"use client";
import React, { useState, useRef, useEffect, FormEvent } from "react";
import { Monitor } from "lucide-react";

type Command = {
  description: string;
  systemCalls: string[];
  execute: (args: string[]) => string;
};

const commands: Record<string, Command> = {
  help: {
    description: "Show available commands",
    systemCalls: ["read()", "write()", "ioctl()"],
    execute: () =>
      Object.entries(commands)
        .map(([cmd, info]) => `${cmd} - ${info.description}`)
        .join("\n"),
  },
  ls: {
    description: "List directory contents",
    systemCalls: ["getdents()", "read()", "opendir()"],
    execute: () => "Documents  Downloads  Pictures  Music  Videos",
  },
  pwd: {
    description: "Print working directory",
    systemCalls: ["getcwd()", "write()"],
    execute: () => "/home/user",
  },
  echo: {
    description: "Display a line of text",
    systemCalls: ["write()", "printf()"],
    execute: (args) => args.slice(1).join(" "),
  },
  date: {
    description: "Display current date and time",
    systemCalls: ["time()", "gettimeofday()"],
    execute: () => new Date().toString(),
  },
  clear: {
    description: "Clear terminal screen",
    systemCalls: ["ioctl(TIOCGWINSZ)"],
    execute: () => "",
  },
  whoami: {
    description: "Print current user",
    systemCalls: ["getuid()", "getpwuid()"],
    execute: () => "user",
  },
  uname: {
    description: "Print system information",
    systemCalls: ["uname()"],
    execute: () => "Linux WebContainer 5.15.0-1053-azure",
  },
  ps: {
    description: "Report process status",
    systemCalls: ["fork()", "exec()", "wait()"],
    execute: () =>
      "PID TTY          TIME CMD\n 1 pts/0    00:00:00 bash\n 2 pts/0    00:00:00 node",
  },
  mkdir: {
    description: "Create new directory",
    systemCalls: ["mkdir()", "chmod()"],
    execute: (args) =>
      args[1] ? `Directory '${args[1]}' created` : "Missing directory name",
  },
  touch: {
    description: "Create an empty file",
    systemCalls: ["open()", "write()"],
    execute: (args) =>
      args[1] ? `File '${args[1]}' created` : "Missing file name",
  },
  rm: {
    description: "Remove a file",
    systemCalls: ["unlink()"],
    execute: (args) =>
      args[1] ? `File '${args[1]}' removed` : "Missing file name",
  },
  cd: {
    description: "Change directory",
    systemCalls: ["chdir()", "getcwd()"],
    execute: (args) =>
      args[1] ? `Changed directory to '${args[1]}'` : "Missing directory name",
  },
  rmdir: {
    description: "Remove a directory",
    systemCalls: ["rmdir()"],
    execute: (args) =>
      args[1] ? `Directory '${args[1]}' removed` : "Missing directory name",
  },
  cat: {
    description: "Concatenate and display file contents",
    systemCalls: ["open()", "read()", "write()"],
    execute: (args) =>
      args[1] ? `Contents of file '${args[1]}'` : "Missing file name",
  },
  mv: {
    description: "Move or rename a file",
    systemCalls: ["rename()"],
    execute: (args) =>
      args[1] && args[2]
        ? `Moved '${args[1]}' to '${args[2]}'`
        : "Missing source or destination",
  },
  cp: {
    description: "Copy a file",
    systemCalls: ["open()", "read()", "write()"],
    execute: (args) =>
      args[1] && args[2]
        ? `Copied '${args[1]}' to '${args[2]}'`
        : "Missing source or destination",
  },
  uptime: {
    description: "Show system uptime",
    systemCalls: ["sysinfo()"],
    execute: () => "System uptime: 1 day, 2 hours, 34 minutes",
  },
  free: {
    description: "Show memory usage",
    systemCalls: ["sysinfo()"],
    execute: () =>
      "              total        used        free      shared  buff/cache   available\nMem:        16384       8192       4096        512        4096       10240\nSwap:        8192       1024       7168",
  },
  ping: {
    description: "Send ICMP echo request to a network host",
    systemCalls: ["socket()", "sendto()", "recvfrom()"],
    execute: (args) =>
      args[1]
        ? `Pinging ${args[1]}... Response received!`
        : "Missing host address",
  },
  kill: {
    description: "Terminate a process by PID",
    systemCalls: ["kill()"],
    execute: (args) =>
      args[1] ? `Process ${args[1]} terminated` : "Missing process ID",
  },
  chmod: {
    description: "Change file permissions",
    systemCalls: ["chmod()"],
    execute: (args) =>
      args[1] && args[2]
        ? `Permissions of '${args[2]}' changed to '${args[1]}'`
        : "Missing mode or file name",
  },
  df: {
    description: "Show disk space usage",
    systemCalls: ["statvfs()"],
    execute: () =>
      "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   20G   30G  40% /",
  },
  head: {
    description: "Output the first part of a file",
    systemCalls: ["open()", "read()"],
    execute: (args) =>
      args[1] ? `First 10 lines of '${args[1]}'` : "Missing file name",
  },
  tail: {
    description: "Output the last part of a file",
    systemCalls: ["open()", "read()"],
    execute: (args) =>
      args[1] ? `Last 10 lines of '${args[1]}'` : "Missing file name",
  },
  wc: {
    description: "Count lines, words, and bytes in a file",
    systemCalls: ["open()", "read()"],
    execute: (args) =>
      args[1]
        ? `10 lines, 50 words, 200 bytes in '${args[1]}'`
        : "Missing file name",
  },
  locate: {
    description: "Find files by name",
    systemCalls: ["read()"],
    execute: (args) =>
      args[1]
        ? `Results for '${args[1]}': /path/to/${args[1]}`
        : "Missing file name",
  },
  grep: {
    description: "Search for a pattern in a file",
    systemCalls: ["open()", "read()", "write()"],
    execute: (args) =>
      args[1] && args[2]
        ? `Searching for '${args[1]}' in '${args[2]}'... Matches found!`
        : "Missing pattern or file name",
  },
};

type HistoryEntry = {
  command: string;
  output: string;
  systemCalls: string[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentSystemCalls, setCurrentSystemCalls] = useState<string[]>([]);
  const [currentCallIndex, setCurrentCallIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
    inputRef.current?.focus();
  }, [history]);

  const processCommand = async (cmd: string) => {
    const args = cmd.trim().split(" ");
    const command = args[0].toLowerCase();

    if (command === "") return;

    setIsProcessing(true);
    setCurrentCallIndex(-1);

    let output = "";
    let systemCalls: string[] = [];

    const commandDef = commands[command];

    if (command === "clear") {
      setHistory([]);
      systemCalls = commands.clear.systemCalls;
    } else if (commandDef) {
      systemCalls = commandDef.systemCalls;
      output = commandDef.execute(args);
    } else {
      systemCalls = ["write()"];
      output = `Command not found: ${command}`;
    }

    setCurrentSystemCalls(systemCalls);

    for (let i = 0; i < systemCalls.length; i++) {
      setCurrentCallIndex(i);
      await sleep(300);
    }
    await sleep(500);

    if (command !== "clear") {
      setHistory((prev) => [...prev, { command: cmd, output, systemCalls }]);
    }

    setCurrentSystemCalls([]);
    setCurrentCallIndex(-1);
    setIsProcessing(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isProcessing && input.trim()) {
      processCommand(input);
      setInput("");
    }
  };

  return (
    <div className="flex">
      <div className="flex-1 p-4 font-mono text-sm overflow-hidden">
        <div
          ref={historyRef}
          className="h-[40vh] sm:h-[50vh] overflow-y-auto space-y-2"
        >
          <span>
            <span className="text-green-400">&gt; </span>
            Use 'help' to view all the xTerminal commands.
          </span>

          {history.map((entry, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center">
                <span className="text-green-400">$ </span>
                <span className="ml-2">{entry.command}</span>
              </div>
              <div className="text-gray-300 whitespace-pre-wrap pl-4">
                {entry.output}
              </div>
            </div>
          ))}
          <form onSubmit={handleSubmit} className="flex items-center">
            <span className="text-green-400">$ </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              className="flex-1 ml-2 bg-transparent outline-none caret-green-400"
              autoFocus
            />
          </form>
        </div>
      </div>

      <div className="w-40 sm:w-64 border-l border-gray-700 p-4">
        <div className="flex items-center mb-4 text-sm text-gray-400">
          <Monitor className="w-4 h-4 mr-2" />
          System Calls
        </div>
        <div className="font-mono text-xs space-y-1">
          {currentSystemCalls.map((call, i) => (
            <div
              key={i}
              className={`text-yellow-400 transition-opacity duration-200 ${
                i <= currentCallIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              {call}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
