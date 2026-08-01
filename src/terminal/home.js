// ---------------------------------------------------------------
// The VFS root, in its own module.
//
// TerminalContext needs the shell's initial cwd at app startup, but
// importing it from vfs.js would drag the whole filesystem — and the
// labs, notes, and projects data behind it — into the main bundle.
// One constant, no dependencies, so the terminal stays lazy.
// ---------------------------------------------------------------

export const HOME = "~";
