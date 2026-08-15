// ---------------------------------------------------------------
// Public surface of the terminal subsystem (§6.2). Everything outside
// src/terminal/ should import from here, so the internals stay free
// to move.
// ---------------------------------------------------------------

export { execute } from "./engine";
export { parse, tokenize, expandVars } from "./parser";
export { complete, commonPrefix } from "./completion";
export {
    resolve,
    listCommands,
    commandNames,
    commandsByCategory,
    commandCount,
    registryIssues,
    CATEGORIES,
} from "./registry";
export {
    loadHistory,
    saveHistory,
    pushHistory,
    clearHistory,
    navigate,
    reverseSearch,
    expandBang,
} from "./history";
export * as output from "./output";
export { Block, blockToText } from "./ansi";
export { resolvePath, getNode, listDir, renderTree, allPaths, HOME } from "./vfs";
