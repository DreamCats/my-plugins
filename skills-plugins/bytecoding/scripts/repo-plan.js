#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/commander/lib/error.js
var require_error = __commonJS({
  "node_modules/commander/lib/error.js"(exports2) {
    var CommanderError2 = class extends Error {
      /**
       * Constructs the CommanderError class
       * @param {number} exitCode suggested exit code which could be used with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       */
      constructor(exitCode, code, message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = code;
        this.exitCode = exitCode;
        this.nestedError = void 0;
      }
    };
    var InvalidArgumentError2 = class extends CommanderError2 {
      /**
       * Constructs the InvalidArgumentError class
       * @param {string} [message] explanation of why argument is invalid
       */
      constructor(message) {
        super(1, "commander.invalidArgument", message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
      }
    };
    exports2.CommanderError = CommanderError2;
    exports2.InvalidArgumentError = InvalidArgumentError2;
  }
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS({
  "node_modules/commander/lib/argument.js"(exports2) {
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Argument2 = class {
      /**
       * Initialize a new command argument with the given name and description.
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @param {string} name
       * @param {string} [description]
       */
      constructor(name, description) {
        this.description = description || "";
        this.variadic = false;
        this.parseArg = void 0;
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.argChoices = void 0;
        switch (name[0]) {
          case "<":
            this.required = true;
            this._name = name.slice(1, -1);
            break;
          case "[":
            this.required = false;
            this._name = name.slice(1, -1);
            break;
          default:
            this.required = true;
            this._name = name;
            break;
        }
        if (this._name.endsWith("...")) {
          this.variadic = true;
          this._name = this._name.slice(0, -3);
        }
      }
      /**
       * Return argument name.
       *
       * @return {string}
       */
      name() {
        return this._name;
      }
      /**
       * @package
       */
      _collectValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        previous.push(value);
        return previous;
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Argument}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Set the custom handler for processing CLI command arguments into argument values.
       *
       * @param {Function} [fn]
       * @return {Argument}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Only allow argument value to be one of choices.
       *
       * @param {string[]} values
       * @return {Argument}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._collectValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Make argument required.
       *
       * @returns {Argument}
       */
      argRequired() {
        this.required = true;
        return this;
      }
      /**
       * Make argument optional.
       *
       * @returns {Argument}
       */
      argOptional() {
        this.required = false;
        return this;
      }
    };
    function humanReadableArgName(arg) {
      const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
      return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
    }
    exports2.Argument = Argument2;
    exports2.humanReadableArgName = humanReadableArgName;
  }
});

// node_modules/commander/lib/help.js
var require_help = __commonJS({
  "node_modules/commander/lib/help.js"(exports2) {
    var { humanReadableArgName } = require_argument();
    var Help2 = class {
      constructor() {
        this.helpWidth = void 0;
        this.minWidthToWrap = 40;
        this.sortSubcommands = false;
        this.sortOptions = false;
        this.showGlobalOptions = false;
      }
      /**
       * prepareContext is called by Commander after applying overrides from `Command.configureHelp()`
       * and just before calling `formatHelp()`.
       *
       * Commander just uses the helpWidth and the rest is provided for optional use by more complex subclasses.
       *
       * @param {{ error?: boolean, helpWidth?: number, outputHasColors?: boolean }} contextOptions
       */
      prepareContext(contextOptions) {
        this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
      }
      /**
       * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
       *
       * @param {Command} cmd
       * @returns {Command[]}
       */
      visibleCommands(cmd) {
        const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
        const helpCommand = cmd._getHelpCommand();
        if (helpCommand && !helpCommand._hidden) {
          visibleCommands.push(helpCommand);
        }
        if (this.sortSubcommands) {
          visibleCommands.sort((a, b) => {
            return a.name().localeCompare(b.name());
          });
        }
        return visibleCommands;
      }
      /**
       * Compare options for sort.
       *
       * @param {Option} a
       * @param {Option} b
       * @returns {number}
       */
      compareOptions(a, b) {
        const getSortKey = (option) => {
          return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
        };
        return getSortKey(a).localeCompare(getSortKey(b));
      }
      /**
       * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleOptions(cmd) {
        const visibleOptions = cmd.options.filter((option) => !option.hidden);
        const helpOption = cmd._getHelpOption();
        if (helpOption && !helpOption.hidden) {
          const removeShort = helpOption.short && cmd._findOption(helpOption.short);
          const removeLong = helpOption.long && cmd._findOption(helpOption.long);
          if (!removeShort && !removeLong) {
            visibleOptions.push(helpOption);
          } else if (helpOption.long && !removeLong) {
            visibleOptions.push(
              cmd.createOption(helpOption.long, helpOption.description)
            );
          } else if (helpOption.short && !removeShort) {
            visibleOptions.push(
              cmd.createOption(helpOption.short, helpOption.description)
            );
          }
        }
        if (this.sortOptions) {
          visibleOptions.sort(this.compareOptions);
        }
        return visibleOptions;
      }
      /**
       * Get an array of the visible global options. (Not including help.)
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleGlobalOptions(cmd) {
        if (!this.showGlobalOptions) return [];
        const globalOptions = [];
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          const visibleOptions = ancestorCmd.options.filter(
            (option) => !option.hidden
          );
          globalOptions.push(...visibleOptions);
        }
        if (this.sortOptions) {
          globalOptions.sort(this.compareOptions);
        }
        return globalOptions;
      }
      /**
       * Get an array of the arguments if any have a description.
       *
       * @param {Command} cmd
       * @returns {Argument[]}
       */
      visibleArguments(cmd) {
        if (cmd._argsDescription) {
          cmd.registeredArguments.forEach((argument) => {
            argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
          });
        }
        if (cmd.registeredArguments.find((argument) => argument.description)) {
          return cmd.registeredArguments;
        }
        return [];
      }
      /**
       * Get the command term to show in the list of subcommands.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandTerm(cmd) {
        const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
        return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + // simplistic check for non-help option
        (args ? " " + args : "");
      }
      /**
       * Get the option term to show in the list of options.
       *
       * @param {Option} option
       * @returns {string}
       */
      optionTerm(option) {
        return option.flags;
      }
      /**
       * Get the argument term to show in the list of arguments.
       *
       * @param {Argument} argument
       * @returns {string}
       */
      argumentTerm(argument) {
        return argument.name();
      }
      /**
       * Get the longest command term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestSubcommandTermLength(cmd, helper) {
        return helper.visibleCommands(cmd).reduce((max, command) => {
          return Math.max(
            max,
            this.displayWidth(
              helper.styleSubcommandTerm(helper.subcommandTerm(command))
            )
          );
        }, 0);
      }
      /**
       * Get the longest option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestOptionTermLength(cmd, helper) {
        return helper.visibleOptions(cmd).reduce((max, option) => {
          return Math.max(
            max,
            this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
          );
        }, 0);
      }
      /**
       * Get the longest global option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestGlobalOptionTermLength(cmd, helper) {
        return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
          return Math.max(
            max,
            this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
          );
        }, 0);
      }
      /**
       * Get the longest argument term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestArgumentTermLength(cmd, helper) {
        return helper.visibleArguments(cmd).reduce((max, argument) => {
          return Math.max(
            max,
            this.displayWidth(
              helper.styleArgumentTerm(helper.argumentTerm(argument))
            )
          );
        }, 0);
      }
      /**
       * Get the command usage to be displayed at the top of the built-in help.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandUsage(cmd) {
        let cmdName = cmd._name;
        if (cmd._aliases[0]) {
          cmdName = cmdName + "|" + cmd._aliases[0];
        }
        let ancestorCmdNames = "";
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
        }
        return ancestorCmdNames + cmdName + " " + cmd.usage();
      }
      /**
       * Get the description for the command.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandDescription(cmd) {
        return cmd.description();
      }
      /**
       * Get the subcommand summary to show in the list of subcommands.
       * (Fallback to description for backwards compatibility.)
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandDescription(cmd) {
        return cmd.summary() || cmd.description();
      }
      /**
       * Get the option description to show in the list of options.
       *
       * @param {Option} option
       * @return {string}
       */
      optionDescription(option) {
        const extraInfo = [];
        if (option.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (option.defaultValue !== void 0) {
          const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
          if (showDefault) {
            extraInfo.push(
              `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`
            );
          }
        }
        if (option.presetArg !== void 0 && option.optional) {
          extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
        }
        if (option.envVar !== void 0) {
          extraInfo.push(`env: ${option.envVar}`);
        }
        if (extraInfo.length > 0) {
          const extraDescription = `(${extraInfo.join(", ")})`;
          if (option.description) {
            return `${option.description} ${extraDescription}`;
          }
          return extraDescription;
        }
        return option.description;
      }
      /**
       * Get the argument description to show in the list of arguments.
       *
       * @param {Argument} argument
       * @return {string}
       */
      argumentDescription(argument) {
        const extraInfo = [];
        if (argument.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (argument.defaultValue !== void 0) {
          extraInfo.push(
            `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`
          );
        }
        if (extraInfo.length > 0) {
          const extraDescription = `(${extraInfo.join(", ")})`;
          if (argument.description) {
            return `${argument.description} ${extraDescription}`;
          }
          return extraDescription;
        }
        return argument.description;
      }
      /**
       * Format a list of items, given a heading and an array of formatted items.
       *
       * @param {string} heading
       * @param {string[]} items
       * @param {Help} helper
       * @returns string[]
       */
      formatItemList(heading, items, helper) {
        if (items.length === 0) return [];
        return [helper.styleTitle(heading), ...items, ""];
      }
      /**
       * Group items by their help group heading.
       *
       * @param {Command[] | Option[]} unsortedItems
       * @param {Command[] | Option[]} visibleItems
       * @param {Function} getGroup
       * @returns {Map<string, Command[] | Option[]>}
       */
      groupItems(unsortedItems, visibleItems, getGroup) {
        const result = /* @__PURE__ */ new Map();
        unsortedItems.forEach((item) => {
          const group = getGroup(item);
          if (!result.has(group)) result.set(group, []);
        });
        visibleItems.forEach((item) => {
          const group = getGroup(item);
          if (!result.has(group)) {
            result.set(group, []);
          }
          result.get(group).push(item);
        });
        return result;
      }
      /**
       * Generate the built-in help text.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {string}
       */
      formatHelp(cmd, helper) {
        const termWidth = helper.padWidth(cmd, helper);
        const helpWidth = helper.helpWidth ?? 80;
        function callFormatItem(term, description) {
          return helper.formatItem(term, termWidth, description, helper);
        }
        let output = [
          `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
          ""
        ];
        const commandDescription = helper.commandDescription(cmd);
        if (commandDescription.length > 0) {
          output = output.concat([
            helper.boxWrap(
              helper.styleCommandDescription(commandDescription),
              helpWidth
            ),
            ""
          ]);
        }
        const argumentList = helper.visibleArguments(cmd).map((argument) => {
          return callFormatItem(
            helper.styleArgumentTerm(helper.argumentTerm(argument)),
            helper.styleArgumentDescription(helper.argumentDescription(argument))
          );
        });
        output = output.concat(
          this.formatItemList("Arguments:", argumentList, helper)
        );
        const optionGroups = this.groupItems(
          cmd.options,
          helper.visibleOptions(cmd),
          (option) => option.helpGroupHeading ?? "Options:"
        );
        optionGroups.forEach((options, group) => {
          const optionList = options.map((option) => {
            return callFormatItem(
              helper.styleOptionTerm(helper.optionTerm(option)),
              helper.styleOptionDescription(helper.optionDescription(option))
            );
          });
          output = output.concat(this.formatItemList(group, optionList, helper));
        });
        if (helper.showGlobalOptions) {
          const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
            return callFormatItem(
              helper.styleOptionTerm(helper.optionTerm(option)),
              helper.styleOptionDescription(helper.optionDescription(option))
            );
          });
          output = output.concat(
            this.formatItemList("Global Options:", globalOptionList, helper)
          );
        }
        const commandGroups = this.groupItems(
          cmd.commands,
          helper.visibleCommands(cmd),
          (sub) => sub.helpGroup() || "Commands:"
        );
        commandGroups.forEach((commands, group) => {
          const commandList = commands.map((sub) => {
            return callFormatItem(
              helper.styleSubcommandTerm(helper.subcommandTerm(sub)),
              helper.styleSubcommandDescription(helper.subcommandDescription(sub))
            );
          });
          output = output.concat(this.formatItemList(group, commandList, helper));
        });
        return output.join("\n");
      }
      /**
       * Return display width of string, ignoring ANSI escape sequences. Used in padding and wrapping calculations.
       *
       * @param {string} str
       * @returns {number}
       */
      displayWidth(str) {
        return stripColor(str).length;
      }
      /**
       * Style the title for displaying in the help. Called with 'Usage:', 'Options:', etc.
       *
       * @param {string} str
       * @returns {string}
       */
      styleTitle(str) {
        return str;
      }
      styleUsage(str) {
        return str.split(" ").map((word) => {
          if (word === "[options]") return this.styleOptionText(word);
          if (word === "[command]") return this.styleSubcommandText(word);
          if (word[0] === "[" || word[0] === "<")
            return this.styleArgumentText(word);
          return this.styleCommandText(word);
        }).join(" ");
      }
      styleCommandDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleOptionDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleSubcommandDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleArgumentDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleDescriptionText(str) {
        return str;
      }
      styleOptionTerm(str) {
        return this.styleOptionText(str);
      }
      styleSubcommandTerm(str) {
        return str.split(" ").map((word) => {
          if (word === "[options]") return this.styleOptionText(word);
          if (word[0] === "[" || word[0] === "<")
            return this.styleArgumentText(word);
          return this.styleSubcommandText(word);
        }).join(" ");
      }
      styleArgumentTerm(str) {
        return this.styleArgumentText(str);
      }
      styleOptionText(str) {
        return str;
      }
      styleArgumentText(str) {
        return str;
      }
      styleSubcommandText(str) {
        return str;
      }
      styleCommandText(str) {
        return str;
      }
      /**
       * Calculate the pad width from the maximum term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      padWidth(cmd, helper) {
        return Math.max(
          helper.longestOptionTermLength(cmd, helper),
          helper.longestGlobalOptionTermLength(cmd, helper),
          helper.longestSubcommandTermLength(cmd, helper),
          helper.longestArgumentTermLength(cmd, helper)
        );
      }
      /**
       * Detect manually wrapped and indented strings by checking for line break followed by whitespace.
       *
       * @param {string} str
       * @returns {boolean}
       */
      preformatted(str) {
        return /\n[^\S\r\n]/.test(str);
      }
      /**
       * Format the "item", which consists of a term and description. Pad the term and wrap the description, indenting the following lines.
       *
       * So "TTT", 5, "DDD DDDD DD DDD" might be formatted for this.helpWidth=17 like so:
       *   TTT  DDD DDDD
       *        DD DDD
       *
       * @param {string} term
       * @param {number} termWidth
       * @param {string} description
       * @param {Help} helper
       * @returns {string}
       */
      formatItem(term, termWidth, description, helper) {
        const itemIndent = 2;
        const itemIndentStr = " ".repeat(itemIndent);
        if (!description) return itemIndentStr + term;
        const paddedTerm = term.padEnd(
          termWidth + term.length - helper.displayWidth(term)
        );
        const spacerWidth = 2;
        const helpWidth = this.helpWidth ?? 80;
        const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
        let formattedDescription;
        if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
          formattedDescription = description;
        } else {
          const wrappedDescription = helper.boxWrap(description, remainingWidth);
          formattedDescription = wrappedDescription.replace(
            /\n/g,
            "\n" + " ".repeat(termWidth + spacerWidth)
          );
        }
        return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
      }
      /**
       * Wrap a string at whitespace, preserving existing line breaks.
       * Wrapping is skipped if the width is less than `minWidthToWrap`.
       *
       * @param {string} str
       * @param {number} width
       * @returns {string}
       */
      boxWrap(str, width) {
        if (width < this.minWidthToWrap) return str;
        const rawLines = str.split(/\r\n|\n/);
        const chunkPattern = /[\s]*[^\s]+/g;
        const wrappedLines = [];
        rawLines.forEach((line) => {
          const chunks = line.match(chunkPattern);
          if (chunks === null) {
            wrappedLines.push("");
            return;
          }
          let sumChunks = [chunks.shift()];
          let sumWidth = this.displayWidth(sumChunks[0]);
          chunks.forEach((chunk) => {
            const visibleWidth = this.displayWidth(chunk);
            if (sumWidth + visibleWidth <= width) {
              sumChunks.push(chunk);
              sumWidth += visibleWidth;
              return;
            }
            wrappedLines.push(sumChunks.join(""));
            const nextChunk = chunk.trimStart();
            sumChunks = [nextChunk];
            sumWidth = this.displayWidth(nextChunk);
          });
          wrappedLines.push(sumChunks.join(""));
        });
        return wrappedLines.join("\n");
      }
    };
    function stripColor(str) {
      const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
      return str.replace(sgrPattern, "");
    }
    exports2.Help = Help2;
    exports2.stripColor = stripColor;
  }
});

// node_modules/commander/lib/option.js
var require_option = __commonJS({
  "node_modules/commander/lib/option.js"(exports2) {
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Option2 = class {
      /**
       * Initialize a new `Option` with the given `flags` and `description`.
       *
       * @param {string} flags
       * @param {string} [description]
       */
      constructor(flags, description) {
        this.flags = flags;
        this.description = description || "";
        this.required = flags.includes("<");
        this.optional = flags.includes("[");
        this.variadic = /\w\.\.\.[>\]]$/.test(flags);
        this.mandatory = false;
        const optionFlags = splitOptionFlags(flags);
        this.short = optionFlags.shortFlag;
        this.long = optionFlags.longFlag;
        this.negate = false;
        if (this.long) {
          this.negate = this.long.startsWith("--no-");
        }
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.presetArg = void 0;
        this.envVar = void 0;
        this.parseArg = void 0;
        this.hidden = false;
        this.argChoices = void 0;
        this.conflictsWith = [];
        this.implied = void 0;
        this.helpGroupHeading = void 0;
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Option}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Preset to use when option used without option-argument, especially optional but also boolean and negated.
       * The custom processing (parseArg) is called.
       *
       * @example
       * new Option('--color').default('GREYSCALE').preset('RGB');
       * new Option('--donate [amount]').preset('20').argParser(parseFloat);
       *
       * @param {*} arg
       * @return {Option}
       */
      preset(arg) {
        this.presetArg = arg;
        return this;
      }
      /**
       * Add option name(s) that conflict with this option.
       * An error will be displayed if conflicting options are found during parsing.
       *
       * @example
       * new Option('--rgb').conflicts('cmyk');
       * new Option('--js').conflicts(['ts', 'jsx']);
       *
       * @param {(string | string[])} names
       * @return {Option}
       */
      conflicts(names) {
        this.conflictsWith = this.conflictsWith.concat(names);
        return this;
      }
      /**
       * Specify implied option values for when this option is set and the implied options are not.
       *
       * The custom processing (parseArg) is not called on the implied values.
       *
       * @example
       * program
       *   .addOption(new Option('--log', 'write logging information to file'))
       *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
       *
       * @param {object} impliedOptionValues
       * @return {Option}
       */
      implies(impliedOptionValues) {
        let newImplied = impliedOptionValues;
        if (typeof impliedOptionValues === "string") {
          newImplied = { [impliedOptionValues]: true };
        }
        this.implied = Object.assign(this.implied || {}, newImplied);
        return this;
      }
      /**
       * Set environment variable to check for option value.
       *
       * An environment variable is only used if when processed the current option value is
       * undefined, or the source of the current value is 'default' or 'config' or 'env'.
       *
       * @param {string} name
       * @return {Option}
       */
      env(name) {
        this.envVar = name;
        return this;
      }
      /**
       * Set the custom handler for processing CLI option arguments into option values.
       *
       * @param {Function} [fn]
       * @return {Option}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Whether the option is mandatory and must have a value after parsing.
       *
       * @param {boolean} [mandatory=true]
       * @return {Option}
       */
      makeOptionMandatory(mandatory = true) {
        this.mandatory = !!mandatory;
        return this;
      }
      /**
       * Hide option in help.
       *
       * @param {boolean} [hide=true]
       * @return {Option}
       */
      hideHelp(hide = true) {
        this.hidden = !!hide;
        return this;
      }
      /**
       * @package
       */
      _collectValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        previous.push(value);
        return previous;
      }
      /**
       * Only allow option value to be one of choices.
       *
       * @param {string[]} values
       * @return {Option}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._collectValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Return option name.
       *
       * @return {string}
       */
      name() {
        if (this.long) {
          return this.long.replace(/^--/, "");
        }
        return this.short.replace(/^-/, "");
      }
      /**
       * Return option name, in a camelcase format that can be used
       * as an object attribute key.
       *
       * @return {string}
       */
      attributeName() {
        if (this.negate) {
          return camelcase(this.name().replace(/^no-/, ""));
        }
        return camelcase(this.name());
      }
      /**
       * Set the help group heading.
       *
       * @param {string} heading
       * @return {Option}
       */
      helpGroup(heading) {
        this.helpGroupHeading = heading;
        return this;
      }
      /**
       * Check if `arg` matches the short or long flag.
       *
       * @param {string} arg
       * @return {boolean}
       * @package
       */
      is(arg) {
        return this.short === arg || this.long === arg;
      }
      /**
       * Return whether a boolean option.
       *
       * Options are one of boolean, negated, required argument, or optional argument.
       *
       * @return {boolean}
       * @package
       */
      isBoolean() {
        return !this.required && !this.optional && !this.negate;
      }
    };
    var DualOptions = class {
      /**
       * @param {Option[]} options
       */
      constructor(options) {
        this.positiveOptions = /* @__PURE__ */ new Map();
        this.negativeOptions = /* @__PURE__ */ new Map();
        this.dualOptions = /* @__PURE__ */ new Set();
        options.forEach((option) => {
          if (option.negate) {
            this.negativeOptions.set(option.attributeName(), option);
          } else {
            this.positiveOptions.set(option.attributeName(), option);
          }
        });
        this.negativeOptions.forEach((value, key) => {
          if (this.positiveOptions.has(key)) {
            this.dualOptions.add(key);
          }
        });
      }
      /**
       * Did the value come from the option, and not from possible matching dual option?
       *
       * @param {*} value
       * @param {Option} option
       * @returns {boolean}
       */
      valueFromOption(value, option) {
        const optionKey = option.attributeName();
        if (!this.dualOptions.has(optionKey)) return true;
        const preset = this.negativeOptions.get(optionKey).presetArg;
        const negativeValue = preset !== void 0 ? preset : false;
        return option.negate === (negativeValue === value);
      }
    };
    function camelcase(str) {
      return str.split("-").reduce((str2, word) => {
        return str2 + word[0].toUpperCase() + word.slice(1);
      });
    }
    function splitOptionFlags(flags) {
      let shortFlag;
      let longFlag;
      const shortFlagExp = /^-[^-]$/;
      const longFlagExp = /^--[^-]/;
      const flagParts = flags.split(/[ |,]+/).concat("guard");
      if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
      if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
      if (!shortFlag && shortFlagExp.test(flagParts[0]))
        shortFlag = flagParts.shift();
      if (!shortFlag && longFlagExp.test(flagParts[0])) {
        shortFlag = longFlag;
        longFlag = flagParts.shift();
      }
      if (flagParts[0].startsWith("-")) {
        const unsupportedFlag = flagParts[0];
        const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
        if (/^-[^-][^-]/.test(unsupportedFlag))
          throw new Error(
            `${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`
          );
        if (shortFlagExp.test(unsupportedFlag))
          throw new Error(`${baseError}
- too many short flags`);
        if (longFlagExp.test(unsupportedFlag))
          throw new Error(`${baseError}
- too many long flags`);
        throw new Error(`${baseError}
- unrecognised flag format`);
      }
      if (shortFlag === void 0 && longFlag === void 0)
        throw new Error(
          `option creation failed due to no flags found in '${flags}'.`
        );
      return { shortFlag, longFlag };
    }
    exports2.Option = Option2;
    exports2.DualOptions = DualOptions;
  }
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS({
  "node_modules/commander/lib/suggestSimilar.js"(exports2) {
    var maxDistance = 3;
    function editDistance(a, b) {
      if (Math.abs(a.length - b.length) > maxDistance)
        return Math.max(a.length, b.length);
      const d = [];
      for (let i = 0; i <= a.length; i++) {
        d[i] = [i];
      }
      for (let j = 0; j <= b.length; j++) {
        d[0][j] = j;
      }
      for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
          let cost = 1;
          if (a[i - 1] === b[j - 1]) {
            cost = 0;
          } else {
            cost = 1;
          }
          d[i][j] = Math.min(
            d[i - 1][j] + 1,
            // deletion
            d[i][j - 1] + 1,
            // insertion
            d[i - 1][j - 1] + cost
            // substitution
          );
          if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
            d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
          }
        }
      }
      return d[a.length][b.length];
    }
    function suggestSimilar(word, candidates) {
      if (!candidates || candidates.length === 0) return "";
      candidates = Array.from(new Set(candidates));
      const searchingOptions = word.startsWith("--");
      if (searchingOptions) {
        word = word.slice(2);
        candidates = candidates.map((candidate) => candidate.slice(2));
      }
      let similar = [];
      let bestDistance = maxDistance;
      const minSimilarity = 0.4;
      candidates.forEach((candidate) => {
        if (candidate.length <= 1) return;
        const distance = editDistance(word, candidate);
        const length = Math.max(word.length, candidate.length);
        const similarity = (length - distance) / length;
        if (similarity > minSimilarity) {
          if (distance < bestDistance) {
            bestDistance = distance;
            similar = [candidate];
          } else if (distance === bestDistance) {
            similar.push(candidate);
          }
        }
      });
      similar.sort((a, b) => a.localeCompare(b));
      if (searchingOptions) {
        similar = similar.map((candidate) => `--${candidate}`);
      }
      if (similar.length > 1) {
        return `
(Did you mean one of ${similar.join(", ")}?)`;
      }
      if (similar.length === 1) {
        return `
(Did you mean ${similar[0]}?)`;
      }
      return "";
    }
    exports2.suggestSimilar = suggestSimilar;
  }
});

// node_modules/commander/lib/command.js
var require_command = __commonJS({
  "node_modules/commander/lib/command.js"(exports2) {
    var EventEmitter2 = require("node:events").EventEmitter;
    var childProcess = require("node:child_process");
    var path7 = require("node:path");
    var fs7 = require("node:fs");
    var process2 = require("node:process");
    var { Argument: Argument2, humanReadableArgName } = require_argument();
    var { CommanderError: CommanderError2 } = require_error();
    var { Help: Help2, stripColor } = require_help();
    var { Option: Option2, DualOptions } = require_option();
    var { suggestSimilar } = require_suggestSimilar();
    var Command2 = class _Command extends EventEmitter2 {
      /**
       * Initialize a new `Command`.
       *
       * @param {string} [name]
       */
      constructor(name) {
        super();
        this.commands = [];
        this.options = [];
        this.parent = null;
        this._allowUnknownOption = false;
        this._allowExcessArguments = false;
        this.registeredArguments = [];
        this._args = this.registeredArguments;
        this.args = [];
        this.rawArgs = [];
        this.processedArgs = [];
        this._scriptPath = null;
        this._name = name || "";
        this._optionValues = {};
        this._optionValueSources = {};
        this._storeOptionsAsProperties = false;
        this._actionHandler = null;
        this._executableHandler = false;
        this._executableFile = null;
        this._executableDir = null;
        this._defaultCommandName = null;
        this._exitCallback = null;
        this._aliases = [];
        this._combineFlagAndOptionalValue = true;
        this._description = "";
        this._summary = "";
        this._argsDescription = void 0;
        this._enablePositionalOptions = false;
        this._passThroughOptions = false;
        this._lifeCycleHooks = {};
        this._showHelpAfterError = false;
        this._showSuggestionAfterError = true;
        this._savedState = null;
        this._outputConfiguration = {
          writeOut: (str) => process2.stdout.write(str),
          writeErr: (str) => process2.stderr.write(str),
          outputError: (str, write) => write(str),
          getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : void 0,
          getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : void 0,
          getOutHasColors: () => useColor() ?? (process2.stdout.isTTY && process2.stdout.hasColors?.()),
          getErrHasColors: () => useColor() ?? (process2.stderr.isTTY && process2.stderr.hasColors?.()),
          stripColor: (str) => stripColor(str)
        };
        this._hidden = false;
        this._helpOption = void 0;
        this._addImplicitHelpCommand = void 0;
        this._helpCommand = void 0;
        this._helpConfiguration = {};
        this._helpGroupHeading = void 0;
        this._defaultCommandGroup = void 0;
        this._defaultOptionGroup = void 0;
      }
      /**
       * Copy settings that are useful to have in common across root command and subcommands.
       *
       * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
       *
       * @param {Command} sourceCommand
       * @return {Command} `this` command for chaining
       */
      copyInheritedSettings(sourceCommand) {
        this._outputConfiguration = sourceCommand._outputConfiguration;
        this._helpOption = sourceCommand._helpOption;
        this._helpCommand = sourceCommand._helpCommand;
        this._helpConfiguration = sourceCommand._helpConfiguration;
        this._exitCallback = sourceCommand._exitCallback;
        this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
        this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
        this._allowExcessArguments = sourceCommand._allowExcessArguments;
        this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
        this._showHelpAfterError = sourceCommand._showHelpAfterError;
        this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
        return this;
      }
      /**
       * @returns {Command[]}
       * @private
       */
      _getCommandAndAncestors() {
        const result = [];
        for (let command = this; command; command = command.parent) {
          result.push(command);
        }
        return result;
      }
      /**
       * Define a command.
       *
       * There are two styles of command: pay attention to where to put the description.
       *
       * @example
       * // Command implemented using action handler (description is supplied separately to `.command`)
       * program
       *   .command('clone <source> [destination]')
       *   .description('clone a repository into a newly created directory')
       *   .action((source, destination) => {
       *     console.log('clone command called');
       *   });
       *
       * // Command implemented using separate executable file (description is second parameter to `.command`)
       * program
       *   .command('start <service>', 'start named service')
       *   .command('stop [service]', 'stop named service, or all if no name supplied');
       *
       * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
       * @param {(object | string)} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
       * @param {object} [execOpts] - configuration options (for executable)
       * @return {Command} returns new command for action handler, or `this` for executable command
       */
      command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
        let desc = actionOptsOrExecDesc;
        let opts = execOpts;
        if (typeof desc === "object" && desc !== null) {
          opts = desc;
          desc = null;
        }
        opts = opts || {};
        const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
        const cmd = this.createCommand(name);
        if (desc) {
          cmd.description(desc);
          cmd._executableHandler = true;
        }
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        cmd._hidden = !!(opts.noHelp || opts.hidden);
        cmd._executableFile = opts.executableFile || null;
        if (args) cmd.arguments(args);
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd.copyInheritedSettings(this);
        if (desc) return this;
        return cmd;
      }
      /**
       * Factory routine to create a new unattached command.
       *
       * See .command() for creating an attached subcommand, which uses this routine to
       * create the command. You can override createCommand to customise subcommands.
       *
       * @param {string} [name]
       * @return {Command} new command
       */
      createCommand(name) {
        return new _Command(name);
      }
      /**
       * You can customise the help with a subclass of Help by overriding createHelp,
       * or by overriding Help properties using configureHelp().
       *
       * @return {Help}
       */
      createHelp() {
        return Object.assign(new Help2(), this.configureHelp());
      }
      /**
       * You can customise the help by overriding Help properties using configureHelp(),
       * or with a subclass of Help by overriding createHelp().
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureHelp(configuration) {
        if (configuration === void 0) return this._helpConfiguration;
        this._helpConfiguration = configuration;
        return this;
      }
      /**
       * The default output goes to stdout and stderr. You can customise this for special
       * applications. You can also customise the display of errors by overriding outputError.
       *
       * The configuration properties are all functions:
       *
       *     // change how output being written, defaults to stdout and stderr
       *     writeOut(str)
       *     writeErr(str)
       *     // change how output being written for errors, defaults to writeErr
       *     outputError(str, write) // used for displaying errors and not used for displaying help
       *     // specify width for wrapping help
       *     getOutHelpWidth()
       *     getErrHelpWidth()
       *     // color support, currently only used with Help
       *     getOutHasColors()
       *     getErrHasColors()
       *     stripColor() // used to remove ANSI escape codes if output does not have colors
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureOutput(configuration) {
        if (configuration === void 0) return this._outputConfiguration;
        this._outputConfiguration = {
          ...this._outputConfiguration,
          ...configuration
        };
        return this;
      }
      /**
       * Display the help or a custom message after an error occurs.
       *
       * @param {(boolean|string)} [displayHelp]
       * @return {Command} `this` command for chaining
       */
      showHelpAfterError(displayHelp = true) {
        if (typeof displayHelp !== "string") displayHelp = !!displayHelp;
        this._showHelpAfterError = displayHelp;
        return this;
      }
      /**
       * Display suggestion of similar commands for unknown commands, or options for unknown options.
       *
       * @param {boolean} [displaySuggestion]
       * @return {Command} `this` command for chaining
       */
      showSuggestionAfterError(displaySuggestion = true) {
        this._showSuggestionAfterError = !!displaySuggestion;
        return this;
      }
      /**
       * Add a prepared subcommand.
       *
       * See .command() for creating an attached subcommand which inherits settings from its parent.
       *
       * @param {Command} cmd - new subcommand
       * @param {object} [opts] - configuration options
       * @return {Command} `this` command for chaining
       */
      addCommand(cmd, opts) {
        if (!cmd._name) {
          throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
        }
        opts = opts || {};
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        if (opts.noHelp || opts.hidden) cmd._hidden = true;
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd._checkForBrokenPassThrough();
        return this;
      }
      /**
       * Factory routine to create a new unattached argument.
       *
       * See .argument() for creating an attached argument, which uses this routine to
       * create the argument. You can override createArgument to return a custom argument.
       *
       * @param {string} name
       * @param {string} [description]
       * @return {Argument} new argument
       */
      createArgument(name, description) {
        return new Argument2(name, description);
      }
      /**
       * Define argument syntax for command.
       *
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @example
       * program.argument('<input-file>');
       * program.argument('[output-file]');
       *
       * @param {string} name
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom argument processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      argument(name, description, parseArg, defaultValue) {
        const argument = this.createArgument(name, description);
        if (typeof parseArg === "function") {
          argument.default(defaultValue).argParser(parseArg);
        } else {
          argument.default(parseArg);
        }
        this.addArgument(argument);
        return this;
      }
      /**
       * Define argument syntax for command, adding multiple at once (without descriptions).
       *
       * See also .argument().
       *
       * @example
       * program.arguments('<cmd> [env]');
       *
       * @param {string} names
       * @return {Command} `this` command for chaining
       */
      arguments(names) {
        names.trim().split(/ +/).forEach((detail) => {
          this.argument(detail);
        });
        return this;
      }
      /**
       * Define argument syntax for command, adding a prepared argument.
       *
       * @param {Argument} argument
       * @return {Command} `this` command for chaining
       */
      addArgument(argument) {
        const previousArgument = this.registeredArguments.slice(-1)[0];
        if (previousArgument?.variadic) {
          throw new Error(
            `only the last argument can be variadic '${previousArgument.name()}'`
          );
        }
        if (argument.required && argument.defaultValue !== void 0 && argument.parseArg === void 0) {
          throw new Error(
            `a default value for a required argument is never used: '${argument.name()}'`
          );
        }
        this.registeredArguments.push(argument);
        return this;
      }
      /**
       * Customise or override default help command. By default a help command is automatically added if your command has subcommands.
       *
       * @example
       *    program.helpCommand('help [cmd]');
       *    program.helpCommand('help [cmd]', 'show help');
       *    program.helpCommand(false); // suppress default help command
       *    program.helpCommand(true); // add help command even if no subcommands
       *
       * @param {string|boolean} enableOrNameAndArgs - enable with custom name and/or arguments, or boolean to override whether added
       * @param {string} [description] - custom description
       * @return {Command} `this` command for chaining
       */
      helpCommand(enableOrNameAndArgs, description) {
        if (typeof enableOrNameAndArgs === "boolean") {
          this._addImplicitHelpCommand = enableOrNameAndArgs;
          if (enableOrNameAndArgs && this._defaultCommandGroup) {
            this._initCommandGroup(this._getHelpCommand());
          }
          return this;
        }
        const nameAndArgs = enableOrNameAndArgs ?? "help [command]";
        const [, helpName, helpArgs] = nameAndArgs.match(/([^ ]+) *(.*)/);
        const helpDescription = description ?? "display help for command";
        const helpCommand = this.createCommand(helpName);
        helpCommand.helpOption(false);
        if (helpArgs) helpCommand.arguments(helpArgs);
        if (helpDescription) helpCommand.description(helpDescription);
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        if (enableOrNameAndArgs || description) this._initCommandGroup(helpCommand);
        return this;
      }
      /**
       * Add prepared custom help command.
       *
       * @param {(Command|string|boolean)} helpCommand - custom help command, or deprecated enableOrNameAndArgs as for `.helpCommand()`
       * @param {string} [deprecatedDescription] - deprecated custom description used with custom name only
       * @return {Command} `this` command for chaining
       */
      addHelpCommand(helpCommand, deprecatedDescription) {
        if (typeof helpCommand !== "object") {
          this.helpCommand(helpCommand, deprecatedDescription);
          return this;
        }
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        this._initCommandGroup(helpCommand);
        return this;
      }
      /**
       * Lazy create help command.
       *
       * @return {(Command|null)}
       * @package
       */
      _getHelpCommand() {
        const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
        if (hasImplicitHelpCommand) {
          if (this._helpCommand === void 0) {
            this.helpCommand(void 0, void 0);
          }
          return this._helpCommand;
        }
        return null;
      }
      /**
       * Add hook for life cycle event.
       *
       * @param {string} event
       * @param {Function} listener
       * @return {Command} `this` command for chaining
       */
      hook(event, listener) {
        const allowedValues = ["preSubcommand", "preAction", "postAction"];
        if (!allowedValues.includes(event)) {
          throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        if (this._lifeCycleHooks[event]) {
          this._lifeCycleHooks[event].push(listener);
        } else {
          this._lifeCycleHooks[event] = [listener];
        }
        return this;
      }
      /**
       * Register callback to use as replacement for calling process.exit.
       *
       * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
       * @return {Command} `this` command for chaining
       */
      exitOverride(fn) {
        if (fn) {
          this._exitCallback = fn;
        } else {
          this._exitCallback = (err) => {
            if (err.code !== "commander.executeSubCommandAsync") {
              throw err;
            } else {
            }
          };
        }
        return this;
      }
      /**
       * Call process.exit, and _exitCallback if defined.
       *
       * @param {number} exitCode exit code for using with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       * @return never
       * @private
       */
      _exit(exitCode, code, message) {
        if (this._exitCallback) {
          this._exitCallback(new CommanderError2(exitCode, code, message));
        }
        process2.exit(exitCode);
      }
      /**
       * Register callback `fn` for the command.
       *
       * @example
       * program
       *   .command('serve')
       *   .description('start service')
       *   .action(function() {
       *      // do work here
       *   });
       *
       * @param {Function} fn
       * @return {Command} `this` command for chaining
       */
      action(fn) {
        const listener = (args) => {
          const expectedArgsCount = this.registeredArguments.length;
          const actionArgs = args.slice(0, expectedArgsCount);
          if (this._storeOptionsAsProperties) {
            actionArgs[expectedArgsCount] = this;
          } else {
            actionArgs[expectedArgsCount] = this.opts();
          }
          actionArgs.push(this);
          return fn.apply(this, actionArgs);
        };
        this._actionHandler = listener;
        return this;
      }
      /**
       * Factory routine to create a new unattached option.
       *
       * See .option() for creating an attached option, which uses this routine to
       * create the option. You can override createOption to return a custom option.
       *
       * @param {string} flags
       * @param {string} [description]
       * @return {Option} new option
       */
      createOption(flags, description) {
        return new Option2(flags, description);
      }
      /**
       * Wrap parseArgs to catch 'commander.invalidArgument'.
       *
       * @param {(Option | Argument)} target
       * @param {string} value
       * @param {*} previous
       * @param {string} invalidArgumentMessage
       * @private
       */
      _callParseArg(target, value, previous, invalidArgumentMessage) {
        try {
          return target.parseArg(value, previous);
        } catch (err) {
          if (err.code === "commander.invalidArgument") {
            const message = `${invalidArgumentMessage} ${err.message}`;
            this.error(message, { exitCode: err.exitCode, code: err.code });
          }
          throw err;
        }
      }
      /**
       * Check for option flag conflicts.
       * Register option if no conflicts found, or throw on conflict.
       *
       * @param {Option} option
       * @private
       */
      _registerOption(option) {
        const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
        if (matchingOption) {
          const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
          throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
        }
        this._initOptionGroup(option);
        this.options.push(option);
      }
      /**
       * Check for command name and alias conflicts with existing commands.
       * Register command if no conflicts found, or throw on conflict.
       *
       * @param {Command} command
       * @private
       */
      _registerCommand(command) {
        const knownBy = (cmd) => {
          return [cmd.name()].concat(cmd.aliases());
        };
        const alreadyUsed = knownBy(command).find(
          (name) => this._findCommand(name)
        );
        if (alreadyUsed) {
          const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
          const newCmd = knownBy(command).join("|");
          throw new Error(
            `cannot add command '${newCmd}' as already have command '${existingCmd}'`
          );
        }
        this._initCommandGroup(command);
        this.commands.push(command);
      }
      /**
       * Add an option.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addOption(option) {
        this._registerOption(option);
        const oname = option.name();
        const name = option.attributeName();
        if (option.negate) {
          const positiveLongFlag = option.long.replace(/^--no-/, "--");
          if (!this._findOption(positiveLongFlag)) {
            this.setOptionValueWithSource(
              name,
              option.defaultValue === void 0 ? true : option.defaultValue,
              "default"
            );
          }
        } else if (option.defaultValue !== void 0) {
          this.setOptionValueWithSource(name, option.defaultValue, "default");
        }
        const handleOptionValue = (val, invalidValueMessage, valueSource) => {
          if (val == null && option.presetArg !== void 0) {
            val = option.presetArg;
          }
          const oldValue = this.getOptionValue(name);
          if (val !== null && option.parseArg) {
            val = this._callParseArg(option, val, oldValue, invalidValueMessage);
          } else if (val !== null && option.variadic) {
            val = option._collectValue(val, oldValue);
          }
          if (val == null) {
            if (option.negate) {
              val = false;
            } else if (option.isBoolean() || option.optional) {
              val = true;
            } else {
              val = "";
            }
          }
          this.setOptionValueWithSource(name, val, valueSource);
        };
        this.on("option:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "cli");
        });
        if (option.envVar) {
          this.on("optionEnv:" + oname, (val) => {
            const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
            handleOptionValue(val, invalidValueMessage, "env");
          });
        }
        return this;
      }
      /**
       * Internal implementation shared by .option() and .requiredOption()
       *
       * @return {Command} `this` command for chaining
       * @private
       */
      _optionEx(config, flags, description, fn, defaultValue) {
        if (typeof flags === "object" && flags instanceof Option2) {
          throw new Error(
            "To add an Option object use addOption() instead of option() or requiredOption()"
          );
        }
        const option = this.createOption(flags, description);
        option.makeOptionMandatory(!!config.mandatory);
        if (typeof fn === "function") {
          option.default(defaultValue).argParser(fn);
        } else if (fn instanceof RegExp) {
          const regex = fn;
          fn = (val, def) => {
            const m = regex.exec(val);
            return m ? m[0] : def;
          };
          option.default(defaultValue).argParser(fn);
        } else {
          option.default(fn);
        }
        return this.addOption(option);
      }
      /**
       * Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
       * option-argument is indicated by `<>` and an optional option-argument by `[]`.
       *
       * See the README for more details, and see also addOption() and requiredOption().
       *
       * @example
       * program
       *     .option('-p, --pepper', 'add pepper')
       *     .option('--pt, --pizza-type <TYPE>', 'type of pizza') // required option-argument
       *     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
       *     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      option(flags, description, parseArg, defaultValue) {
        return this._optionEx({}, flags, description, parseArg, defaultValue);
      }
      /**
       * Add a required option which must have a value after parsing. This usually means
       * the option must be specified on the command line. (Otherwise the same as .option().)
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      requiredOption(flags, description, parseArg, defaultValue) {
        return this._optionEx(
          { mandatory: true },
          flags,
          description,
          parseArg,
          defaultValue
        );
      }
      /**
       * Alter parsing of short flags with optional values.
       *
       * @example
       * // for `.option('-f,--flag [value]'):
       * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
       * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
       *
       * @param {boolean} [combine] - if `true` or omitted, an optional value can be specified directly after the flag.
       * @return {Command} `this` command for chaining
       */
      combineFlagAndOptionalValue(combine = true) {
        this._combineFlagAndOptionalValue = !!combine;
        return this;
      }
      /**
       * Allow unknown options on the command line.
       *
       * @param {boolean} [allowUnknown] - if `true` or omitted, no error will be thrown for unknown options.
       * @return {Command} `this` command for chaining
       */
      allowUnknownOption(allowUnknown = true) {
        this._allowUnknownOption = !!allowUnknown;
        return this;
      }
      /**
       * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
       *
       * @param {boolean} [allowExcess] - if `true` or omitted, no error will be thrown for excess arguments.
       * @return {Command} `this` command for chaining
       */
      allowExcessArguments(allowExcess = true) {
        this._allowExcessArguments = !!allowExcess;
        return this;
      }
      /**
       * Enable positional options. Positional means global options are specified before subcommands which lets
       * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
       * The default behaviour is non-positional and global options may appear anywhere on the command line.
       *
       * @param {boolean} [positional]
       * @return {Command} `this` command for chaining
       */
      enablePositionalOptions(positional = true) {
        this._enablePositionalOptions = !!positional;
        return this;
      }
      /**
       * Pass through options that come after command-arguments rather than treat them as command-options,
       * so actual command-options come before command-arguments. Turning this on for a subcommand requires
       * positional options to have been enabled on the program (parent commands).
       * The default behaviour is non-positional and options may appear before or after command-arguments.
       *
       * @param {boolean} [passThrough] for unknown options.
       * @return {Command} `this` command for chaining
       */
      passThroughOptions(passThrough = true) {
        this._passThroughOptions = !!passThrough;
        this._checkForBrokenPassThrough();
        return this;
      }
      /**
       * @private
       */
      _checkForBrokenPassThrough() {
        if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
          throw new Error(
            `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`
          );
        }
      }
      /**
       * Whether to store option values as properties on command object,
       * or store separately (specify false). In both cases the option values can be accessed using .opts().
       *
       * @param {boolean} [storeAsProperties=true]
       * @return {Command} `this` command for chaining
       */
      storeOptionsAsProperties(storeAsProperties = true) {
        if (this.options.length) {
          throw new Error("call .storeOptionsAsProperties() before adding options");
        }
        if (Object.keys(this._optionValues).length) {
          throw new Error(
            "call .storeOptionsAsProperties() before setting option values"
          );
        }
        this._storeOptionsAsProperties = !!storeAsProperties;
        return this;
      }
      /**
       * Retrieve option value.
       *
       * @param {string} key
       * @return {object} value
       */
      getOptionValue(key) {
        if (this._storeOptionsAsProperties) {
          return this[key];
        }
        return this._optionValues[key];
      }
      /**
       * Store option value.
       *
       * @param {string} key
       * @param {object} value
       * @return {Command} `this` command for chaining
       */
      setOptionValue(key, value) {
        return this.setOptionValueWithSource(key, value, void 0);
      }
      /**
       * Store option value and where the value came from.
       *
       * @param {string} key
       * @param {object} value
       * @param {string} source - expected values are default/config/env/cli/implied
       * @return {Command} `this` command for chaining
       */
      setOptionValueWithSource(key, value, source) {
        if (this._storeOptionsAsProperties) {
          this[key] = value;
        } else {
          this._optionValues[key] = value;
        }
        this._optionValueSources[key] = source;
        return this;
      }
      /**
       * Get source of option value.
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSource(key) {
        return this._optionValueSources[key];
      }
      /**
       * Get source of option value. See also .optsWithGlobals().
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSourceWithGlobals(key) {
        let source;
        this._getCommandAndAncestors().forEach((cmd) => {
          if (cmd.getOptionValueSource(key) !== void 0) {
            source = cmd.getOptionValueSource(key);
          }
        });
        return source;
      }
      /**
       * Get user arguments from implied or explicit arguments.
       * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
       *
       * @private
       */
      _prepareUserArgs(argv, parseOptions) {
        if (argv !== void 0 && !Array.isArray(argv)) {
          throw new Error("first parameter to parse must be array or undefined");
        }
        parseOptions = parseOptions || {};
        if (argv === void 0 && parseOptions.from === void 0) {
          if (process2.versions?.electron) {
            parseOptions.from = "electron";
          }
          const execArgv = process2.execArgv ?? [];
          if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
            parseOptions.from = "eval";
          }
        }
        if (argv === void 0) {
          argv = process2.argv;
        }
        this.rawArgs = argv.slice();
        let userArgs;
        switch (parseOptions.from) {
          case void 0:
          case "node":
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
            break;
          case "electron":
            if (process2.defaultApp) {
              this._scriptPath = argv[1];
              userArgs = argv.slice(2);
            } else {
              userArgs = argv.slice(1);
            }
            break;
          case "user":
            userArgs = argv.slice(0);
            break;
          case "eval":
            userArgs = argv.slice(1);
            break;
          default:
            throw new Error(
              `unexpected parse option { from: '${parseOptions.from}' }`
            );
        }
        if (!this._name && this._scriptPath)
          this.nameFromFilename(this._scriptPath);
        this._name = this._name || "program";
        return userArgs;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Use parseAsync instead of parse if any of your action handlers are async.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * program.parse(); // parse process.argv and auto-detect electron and special node flags
       * program.parse(process.argv); // assume argv[0] is app and argv[1] is script
       * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv] - optional, defaults to process.argv
       * @param {object} [parseOptions] - optionally specify style of options with from: node/user/electron
       * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
       * @return {Command} `this` command for chaining
       */
      parse(argv, parseOptions) {
        this._prepareForParse();
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        this._parseCommand([], userArgs);
        return this;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * await program.parseAsync(); // parse process.argv and auto-detect electron and special node flags
       * await program.parseAsync(process.argv); // assume argv[0] is app and argv[1] is script
       * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv]
       * @param {object} [parseOptions]
       * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
       * @return {Promise}
       */
      async parseAsync(argv, parseOptions) {
        this._prepareForParse();
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        await this._parseCommand([], userArgs);
        return this;
      }
      _prepareForParse() {
        if (this._savedState === null) {
          this.saveStateBeforeParse();
        } else {
          this.restoreStateBeforeParse();
        }
      }
      /**
       * Called the first time parse is called to save state and allow a restore before subsequent calls to parse.
       * Not usually called directly, but available for subclasses to save their custom state.
       *
       * This is called in a lazy way. Only commands used in parsing chain will have state saved.
       */
      saveStateBeforeParse() {
        this._savedState = {
          // name is stable if supplied by author, but may be unspecified for root command and deduced during parsing
          _name: this._name,
          // option values before parse have default values (including false for negated options)
          // shallow clones
          _optionValues: { ...this._optionValues },
          _optionValueSources: { ...this._optionValueSources }
        };
      }
      /**
       * Restore state before parse for calls after the first.
       * Not usually called directly, but available for subclasses to save their custom state.
       *
       * This is called in a lazy way. Only commands used in parsing chain will have state restored.
       */
      restoreStateBeforeParse() {
        if (this._storeOptionsAsProperties)
          throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
        this._name = this._savedState._name;
        this._scriptPath = null;
        this.rawArgs = [];
        this._optionValues = { ...this._savedState._optionValues };
        this._optionValueSources = { ...this._savedState._optionValueSources };
        this.args = [];
        this.processedArgs = [];
      }
      /**
       * Throw if expected executable is missing. Add lots of help for author.
       *
       * @param {string} executableFile
       * @param {string} executableDir
       * @param {string} subcommandName
       */
      _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
        if (fs7.existsSync(executableFile)) return;
        const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
        const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
        throw new Error(executableMissing);
      }
      /**
       * Execute a sub-command executable.
       *
       * @private
       */
      _executeSubCommand(subcommand, args) {
        args = args.slice();
        let launchWithNode = false;
        const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
        function findFile(baseDir, baseName) {
          const localBin = path7.resolve(baseDir, baseName);
          if (fs7.existsSync(localBin)) return localBin;
          if (sourceExt.includes(path7.extname(baseName))) return void 0;
          const foundExt = sourceExt.find(
            (ext) => fs7.existsSync(`${localBin}${ext}`)
          );
          if (foundExt) return `${localBin}${foundExt}`;
          return void 0;
        }
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
        let executableDir = this._executableDir || "";
        if (this._scriptPath) {
          let resolvedScriptPath;
          try {
            resolvedScriptPath = fs7.realpathSync(this._scriptPath);
          } catch {
            resolvedScriptPath = this._scriptPath;
          }
          executableDir = path7.resolve(
            path7.dirname(resolvedScriptPath),
            executableDir
          );
        }
        if (executableDir) {
          let localFile = findFile(executableDir, executableFile);
          if (!localFile && !subcommand._executableFile && this._scriptPath) {
            const legacyName = path7.basename(
              this._scriptPath,
              path7.extname(this._scriptPath)
            );
            if (legacyName !== this._name) {
              localFile = findFile(
                executableDir,
                `${legacyName}-${subcommand._name}`
              );
            }
          }
          executableFile = localFile || executableFile;
        }
        launchWithNode = sourceExt.includes(path7.extname(executableFile));
        let proc;
        if (process2.platform !== "win32") {
          if (launchWithNode) {
            args.unshift(executableFile);
            args = incrementNodeInspectorPort(process2.execArgv).concat(args);
            proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
          } else {
            proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
          }
        } else {
          this._checkForMissingExecutable(
            executableFile,
            executableDir,
            subcommand._name
          );
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
        }
        if (!proc.killed) {
          const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
          signals.forEach((signal) => {
            process2.on(signal, () => {
              if (proc.killed === false && proc.exitCode === null) {
                proc.kill(signal);
              }
            });
          });
        }
        const exitCallback = this._exitCallback;
        proc.on("close", (code) => {
          code = code ?? 1;
          if (!exitCallback) {
            process2.exit(code);
          } else {
            exitCallback(
              new CommanderError2(
                code,
                "commander.executeSubCommandAsync",
                "(close)"
              )
            );
          }
        });
        proc.on("error", (err) => {
          if (err.code === "ENOENT") {
            this._checkForMissingExecutable(
              executableFile,
              executableDir,
              subcommand._name
            );
          } else if (err.code === "EACCES") {
            throw new Error(`'${executableFile}' not executable`);
          }
          if (!exitCallback) {
            process2.exit(1);
          } else {
            const wrappedError = new CommanderError2(
              1,
              "commander.executeSubCommandAsync",
              "(error)"
            );
            wrappedError.nestedError = err;
            exitCallback(wrappedError);
          }
        });
        this.runningCommand = proc;
      }
      /**
       * @private
       */
      _dispatchSubcommand(commandName, operands, unknown) {
        const subCommand = this._findCommand(commandName);
        if (!subCommand) this.help({ error: true });
        subCommand._prepareForParse();
        let promiseChain;
        promiseChain = this._chainOrCallSubCommandHook(
          promiseChain,
          subCommand,
          "preSubcommand"
        );
        promiseChain = this._chainOrCall(promiseChain, () => {
          if (subCommand._executableHandler) {
            this._executeSubCommand(subCommand, operands.concat(unknown));
          } else {
            return subCommand._parseCommand(operands, unknown);
          }
        });
        return promiseChain;
      }
      /**
       * Invoke help directly if possible, or dispatch if necessary.
       * e.g. help foo
       *
       * @private
       */
      _dispatchHelpCommand(subcommandName) {
        if (!subcommandName) {
          this.help();
        }
        const subCommand = this._findCommand(subcommandName);
        if (subCommand && !subCommand._executableHandler) {
          subCommand.help();
        }
        return this._dispatchSubcommand(
          subcommandName,
          [],
          [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]
        );
      }
      /**
       * Check this.args against expected this.registeredArguments.
       *
       * @private
       */
      _checkNumberOfArguments() {
        this.registeredArguments.forEach((arg, i) => {
          if (arg.required && this.args[i] == null) {
            this.missingArgument(arg.name());
          }
        });
        if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
          return;
        }
        if (this.args.length > this.registeredArguments.length) {
          this._excessArguments(this.args);
        }
      }
      /**
       * Process this.args using this.registeredArguments and save as this.processedArgs!
       *
       * @private
       */
      _processArguments() {
        const myParseArg = (argument, value, previous) => {
          let parsedValue = value;
          if (value !== null && argument.parseArg) {
            const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
            parsedValue = this._callParseArg(
              argument,
              value,
              previous,
              invalidValueMessage
            );
          }
          return parsedValue;
        };
        this._checkNumberOfArguments();
        const processedArgs = [];
        this.registeredArguments.forEach((declaredArg, index) => {
          let value = declaredArg.defaultValue;
          if (declaredArg.variadic) {
            if (index < this.args.length) {
              value = this.args.slice(index);
              if (declaredArg.parseArg) {
                value = value.reduce((processed, v) => {
                  return myParseArg(declaredArg, v, processed);
                }, declaredArg.defaultValue);
              }
            } else if (value === void 0) {
              value = [];
            }
          } else if (index < this.args.length) {
            value = this.args[index];
            if (declaredArg.parseArg) {
              value = myParseArg(declaredArg, value, declaredArg.defaultValue);
            }
          }
          processedArgs[index] = value;
        });
        this.processedArgs = processedArgs;
      }
      /**
       * Once we have a promise we chain, but call synchronously until then.
       *
       * @param {(Promise|undefined)} promise
       * @param {Function} fn
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCall(promise, fn) {
        if (promise?.then && typeof promise.then === "function") {
          return promise.then(() => fn());
        }
        return fn();
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallHooks(promise, event) {
        let result = promise;
        const hooks = [];
        this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== void 0).forEach((hookedCommand) => {
          hookedCommand._lifeCycleHooks[event].forEach((callback) => {
            hooks.push({ hookedCommand, callback });
          });
        });
        if (event === "postAction") {
          hooks.reverse();
        }
        hooks.forEach((hookDetail) => {
          result = this._chainOrCall(result, () => {
            return hookDetail.callback(hookDetail.hookedCommand, this);
          });
        });
        return result;
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {Command} subCommand
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallSubCommandHook(promise, subCommand, event) {
        let result = promise;
        if (this._lifeCycleHooks[event] !== void 0) {
          this._lifeCycleHooks[event].forEach((hook) => {
            result = this._chainOrCall(result, () => {
              return hook(this, subCommand);
            });
          });
        }
        return result;
      }
      /**
       * Process arguments in context of this command.
       * Returns action result, in case it is a promise.
       *
       * @private
       */
      _parseCommand(operands, unknown) {
        const parsed = this.parseOptions(unknown);
        this._parseOptionsEnv();
        this._parseOptionsImplied();
        operands = operands.concat(parsed.operands);
        unknown = parsed.unknown;
        this.args = operands.concat(unknown);
        if (operands && this._findCommand(operands[0])) {
          return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
        }
        if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
          return this._dispatchHelpCommand(operands[1]);
        }
        if (this._defaultCommandName) {
          this._outputHelpIfRequested(unknown);
          return this._dispatchSubcommand(
            this._defaultCommandName,
            operands,
            unknown
          );
        }
        if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
          this.help({ error: true });
        }
        this._outputHelpIfRequested(parsed.unknown);
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        const checkForUnknownOptions = () => {
          if (parsed.unknown.length > 0) {
            this.unknownOption(parsed.unknown[0]);
          }
        };
        const commandEvent = `command:${this.name()}`;
        if (this._actionHandler) {
          checkForUnknownOptions();
          this._processArguments();
          let promiseChain;
          promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
          promiseChain = this._chainOrCall(
            promiseChain,
            () => this._actionHandler(this.processedArgs)
          );
          if (this.parent) {
            promiseChain = this._chainOrCall(promiseChain, () => {
              this.parent.emit(commandEvent, operands, unknown);
            });
          }
          promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
          return promiseChain;
        }
        if (this.parent?.listenerCount(commandEvent)) {
          checkForUnknownOptions();
          this._processArguments();
          this.parent.emit(commandEvent, operands, unknown);
        } else if (operands.length) {
          if (this._findCommand("*")) {
            return this._dispatchSubcommand("*", operands, unknown);
          }
          if (this.listenerCount("command:*")) {
            this.emit("command:*", operands, unknown);
          } else if (this.commands.length) {
            this.unknownCommand();
          } else {
            checkForUnknownOptions();
            this._processArguments();
          }
        } else if (this.commands.length) {
          checkForUnknownOptions();
          this.help({ error: true });
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      }
      /**
       * Find matching command.
       *
       * @private
       * @return {Command | undefined}
       */
      _findCommand(name) {
        if (!name) return void 0;
        return this.commands.find(
          (cmd) => cmd._name === name || cmd._aliases.includes(name)
        );
      }
      /**
       * Return an option matching `arg` if any.
       *
       * @param {string} arg
       * @return {Option}
       * @package
       */
      _findOption(arg) {
        return this.options.find((option) => option.is(arg));
      }
      /**
       * Display an error message if a mandatory option does not have a value.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForMissingMandatoryOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd.options.forEach((anOption) => {
            if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === void 0) {
              cmd.missingMandatoryOptionValue(anOption);
            }
          });
        });
      }
      /**
       * Display an error message if conflicting options are used together in this.
       *
       * @private
       */
      _checkForConflictingLocalOptions() {
        const definedNonDefaultOptions = this.options.filter((option) => {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === void 0) {
            return false;
          }
          return this.getOptionValueSource(optionKey) !== "default";
        });
        const optionsWithConflicting = definedNonDefaultOptions.filter(
          (option) => option.conflictsWith.length > 0
        );
        optionsWithConflicting.forEach((option) => {
          const conflictingAndDefined = definedNonDefaultOptions.find(
            (defined) => option.conflictsWith.includes(defined.attributeName())
          );
          if (conflictingAndDefined) {
            this._conflictingOption(option, conflictingAndDefined);
          }
        });
      }
      /**
       * Display an error message if conflicting options are used together.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForConflictingOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd._checkForConflictingLocalOptions();
        });
      }
      /**
       * Parse options from `argv` removing known options,
       * and return argv split into operands and unknown arguments.
       *
       * Side effects: modifies command by storing options. Does not reset state if called again.
       *
       * Examples:
       *
       *     argv => operands, unknown
       *     --known kkk op => [op], []
       *     op --known kkk => [op], []
       *     sub --unknown uuu op => [sub], [--unknown uuu op]
       *     sub -- --unknown uuu op => [sub --unknown uuu op], []
       *
       * @param {string[]} args
       * @return {{operands: string[], unknown: string[]}}
       */
      parseOptions(args) {
        const operands = [];
        const unknown = [];
        let dest = operands;
        function maybeOption(arg) {
          return arg.length > 1 && arg[0] === "-";
        }
        const negativeNumberArg = (arg) => {
          if (!/^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/.test(arg)) return false;
          return !this._getCommandAndAncestors().some(
            (cmd) => cmd.options.map((opt) => opt.short).some((short) => /^-\d$/.test(short))
          );
        };
        let activeVariadicOption = null;
        let activeGroup = null;
        let i = 0;
        while (i < args.length || activeGroup) {
          const arg = activeGroup ?? args[i++];
          activeGroup = null;
          if (arg === "--") {
            if (dest === unknown) dest.push(arg);
            dest.push(...args.slice(i));
            break;
          }
          if (activeVariadicOption && (!maybeOption(arg) || negativeNumberArg(arg))) {
            this.emit(`option:${activeVariadicOption.name()}`, arg);
            continue;
          }
          activeVariadicOption = null;
          if (maybeOption(arg)) {
            const option = this._findOption(arg);
            if (option) {
              if (option.required) {
                const value = args[i++];
                if (value === void 0) this.optionMissingArgument(option);
                this.emit(`option:${option.name()}`, value);
              } else if (option.optional) {
                let value = null;
                if (i < args.length && (!maybeOption(args[i]) || negativeNumberArg(args[i]))) {
                  value = args[i++];
                }
                this.emit(`option:${option.name()}`, value);
              } else {
                this.emit(`option:${option.name()}`);
              }
              activeVariadicOption = option.variadic ? option : null;
              continue;
            }
          }
          if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
            const option = this._findOption(`-${arg[1]}`);
            if (option) {
              if (option.required || option.optional && this._combineFlagAndOptionalValue) {
                this.emit(`option:${option.name()}`, arg.slice(2));
              } else {
                this.emit(`option:${option.name()}`);
                activeGroup = `-${arg.slice(2)}`;
              }
              continue;
            }
          }
          if (/^--[^=]+=/.test(arg)) {
            const index = arg.indexOf("=");
            const option = this._findOption(arg.slice(0, index));
            if (option && (option.required || option.optional)) {
              this.emit(`option:${option.name()}`, arg.slice(index + 1));
              continue;
            }
          }
          if (dest === operands && maybeOption(arg) && !(this.commands.length === 0 && negativeNumberArg(arg))) {
            dest = unknown;
          }
          if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
            if (this._findCommand(arg)) {
              operands.push(arg);
              unknown.push(...args.slice(i));
              break;
            } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
              operands.push(arg, ...args.slice(i));
              break;
            } else if (this._defaultCommandName) {
              unknown.push(arg, ...args.slice(i));
              break;
            }
          }
          if (this._passThroughOptions) {
            dest.push(arg, ...args.slice(i));
            break;
          }
          dest.push(arg);
        }
        return { operands, unknown };
      }
      /**
       * Return an object containing local option values as key-value pairs.
       *
       * @return {object}
       */
      opts() {
        if (this._storeOptionsAsProperties) {
          const result = {};
          const len = this.options.length;
          for (let i = 0; i < len; i++) {
            const key = this.options[i].attributeName();
            result[key] = key === this._versionOptionName ? this._version : this[key];
          }
          return result;
        }
        return this._optionValues;
      }
      /**
       * Return an object containing merged local and global option values as key-value pairs.
       *
       * @return {object}
       */
      optsWithGlobals() {
        return this._getCommandAndAncestors().reduce(
          (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
          {}
        );
      }
      /**
       * Display error message and exit (or call exitOverride).
       *
       * @param {string} message
       * @param {object} [errorOptions]
       * @param {string} [errorOptions.code] - an id string representing the error
       * @param {number} [errorOptions.exitCode] - used with process.exit
       */
      error(message, errorOptions) {
        this._outputConfiguration.outputError(
          `${message}
`,
          this._outputConfiguration.writeErr
        );
        if (typeof this._showHelpAfterError === "string") {
          this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
        } else if (this._showHelpAfterError) {
          this._outputConfiguration.writeErr("\n");
          this.outputHelp({ error: true });
        }
        const config = errorOptions || {};
        const exitCode = config.exitCode || 1;
        const code = config.code || "commander.error";
        this._exit(exitCode, code, message);
      }
      /**
       * Apply any option related environment variables, if option does
       * not have a value from cli or client code.
       *
       * @private
       */
      _parseOptionsEnv() {
        this.options.forEach((option) => {
          if (option.envVar && option.envVar in process2.env) {
            const optionKey = option.attributeName();
            if (this.getOptionValue(optionKey) === void 0 || ["default", "config", "env"].includes(
              this.getOptionValueSource(optionKey)
            )) {
              if (option.required || option.optional) {
                this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
              } else {
                this.emit(`optionEnv:${option.name()}`);
              }
            }
          }
        });
      }
      /**
       * Apply any implied option values, if option is undefined or default value.
       *
       * @private
       */
      _parseOptionsImplied() {
        const dualHelper = new DualOptions(this.options);
        const hasCustomOptionValue = (optionKey) => {
          return this.getOptionValue(optionKey) !== void 0 && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
        };
        this.options.filter(
          (option) => option.implied !== void 0 && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(
            this.getOptionValue(option.attributeName()),
            option
          )
        ).forEach((option) => {
          Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
            this.setOptionValueWithSource(
              impliedKey,
              option.implied[impliedKey],
              "implied"
            );
          });
        });
      }
      /**
       * Argument `name` is missing.
       *
       * @param {string} name
       * @private
       */
      missingArgument(name) {
        const message = `error: missing required argument '${name}'`;
        this.error(message, { code: "commander.missingArgument" });
      }
      /**
       * `Option` is missing an argument.
       *
       * @param {Option} option
       * @private
       */
      optionMissingArgument(option) {
        const message = `error: option '${option.flags}' argument missing`;
        this.error(message, { code: "commander.optionMissingArgument" });
      }
      /**
       * `Option` does not have a value, and is a mandatory option.
       *
       * @param {Option} option
       * @private
       */
      missingMandatoryOptionValue(option) {
        const message = `error: required option '${option.flags}' not specified`;
        this.error(message, { code: "commander.missingMandatoryOptionValue" });
      }
      /**
       * `Option` conflicts with another option.
       *
       * @param {Option} option
       * @param {Option} conflictingOption
       * @private
       */
      _conflictingOption(option, conflictingOption) {
        const findBestOptionFromValue = (option2) => {
          const optionKey = option2.attributeName();
          const optionValue = this.getOptionValue(optionKey);
          const negativeOption = this.options.find(
            (target) => target.negate && optionKey === target.attributeName()
          );
          const positiveOption = this.options.find(
            (target) => !target.negate && optionKey === target.attributeName()
          );
          if (negativeOption && (negativeOption.presetArg === void 0 && optionValue === false || negativeOption.presetArg !== void 0 && optionValue === negativeOption.presetArg)) {
            return negativeOption;
          }
          return positiveOption || option2;
        };
        const getErrorMessage = (option2) => {
          const bestOption = findBestOptionFromValue(option2);
          const optionKey = bestOption.attributeName();
          const source = this.getOptionValueSource(optionKey);
          if (source === "env") {
            return `environment variable '${bestOption.envVar}'`;
          }
          return `option '${bestOption.flags}'`;
        };
        const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
        this.error(message, { code: "commander.conflictingOption" });
      }
      /**
       * Unknown option `flag`.
       *
       * @param {string} flag
       * @private
       */
      unknownOption(flag) {
        if (this._allowUnknownOption) return;
        let suggestion = "";
        if (flag.startsWith("--") && this._showSuggestionAfterError) {
          let candidateFlags = [];
          let command = this;
          do {
            const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
            candidateFlags = candidateFlags.concat(moreFlags);
            command = command.parent;
          } while (command && !command._enablePositionalOptions);
          suggestion = suggestSimilar(flag, candidateFlags);
        }
        const message = `error: unknown option '${flag}'${suggestion}`;
        this.error(message, { code: "commander.unknownOption" });
      }
      /**
       * Excess arguments, more than expected.
       *
       * @param {string[]} receivedArgs
       * @private
       */
      _excessArguments(receivedArgs) {
        if (this._allowExcessArguments) return;
        const expected = this.registeredArguments.length;
        const s = expected === 1 ? "" : "s";
        const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
        const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
        this.error(message, { code: "commander.excessArguments" });
      }
      /**
       * Unknown command.
       *
       * @private
       */
      unknownCommand() {
        const unknownName = this.args[0];
        let suggestion = "";
        if (this._showSuggestionAfterError) {
          const candidateNames = [];
          this.createHelp().visibleCommands(this).forEach((command) => {
            candidateNames.push(command.name());
            if (command.alias()) candidateNames.push(command.alias());
          });
          suggestion = suggestSimilar(unknownName, candidateNames);
        }
        const message = `error: unknown command '${unknownName}'${suggestion}`;
        this.error(message, { code: "commander.unknownCommand" });
      }
      /**
       * Get or set the program version.
       *
       * This method auto-registers the "-V, --version" option which will print the version number.
       *
       * You can optionally supply the flags and description to override the defaults.
       *
       * @param {string} [str]
       * @param {string} [flags]
       * @param {string} [description]
       * @return {(this | string | undefined)} `this` command for chaining, or version string if no arguments
       */
      version(str, flags, description) {
        if (str === void 0) return this._version;
        this._version = str;
        flags = flags || "-V, --version";
        description = description || "output the version number";
        const versionOption = this.createOption(flags, description);
        this._versionOptionName = versionOption.attributeName();
        this._registerOption(versionOption);
        this.on("option:" + versionOption.name(), () => {
          this._outputConfiguration.writeOut(`${str}
`);
          this._exit(0, "commander.version", str);
        });
        return this;
      }
      /**
       * Set the description.
       *
       * @param {string} [str]
       * @param {object} [argsDescription]
       * @return {(string|Command)}
       */
      description(str, argsDescription) {
        if (str === void 0 && argsDescription === void 0)
          return this._description;
        this._description = str;
        if (argsDescription) {
          this._argsDescription = argsDescription;
        }
        return this;
      }
      /**
       * Set the summary. Used when listed as subcommand of parent.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      summary(str) {
        if (str === void 0) return this._summary;
        this._summary = str;
        return this;
      }
      /**
       * Set an alias for the command.
       *
       * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
       *
       * @param {string} [alias]
       * @return {(string|Command)}
       */
      alias(alias) {
        if (alias === void 0) return this._aliases[0];
        let command = this;
        if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
          command = this.commands[this.commands.length - 1];
        }
        if (alias === command._name)
          throw new Error("Command alias can't be the same as its name");
        const matchingCommand = this.parent?._findCommand(alias);
        if (matchingCommand) {
          const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
          throw new Error(
            `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`
          );
        }
        command._aliases.push(alias);
        return this;
      }
      /**
       * Set aliases for the command.
       *
       * Only the first alias is shown in the auto-generated help.
       *
       * @param {string[]} [aliases]
       * @return {(string[]|Command)}
       */
      aliases(aliases) {
        if (aliases === void 0) return this._aliases;
        aliases.forEach((alias) => this.alias(alias));
        return this;
      }
      /**
       * Set / get the command usage `str`.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      usage(str) {
        if (str === void 0) {
          if (this._usage) return this._usage;
          const args = this.registeredArguments.map((arg) => {
            return humanReadableArgName(arg);
          });
          return [].concat(
            this.options.length || this._helpOption !== null ? "[options]" : [],
            this.commands.length ? "[command]" : [],
            this.registeredArguments.length ? args : []
          ).join(" ");
        }
        this._usage = str;
        return this;
      }
      /**
       * Get or set the name of the command.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      name(str) {
        if (str === void 0) return this._name;
        this._name = str;
        return this;
      }
      /**
       * Set/get the help group heading for this subcommand in parent command's help.
       *
       * @param {string} [heading]
       * @return {Command | string}
       */
      helpGroup(heading) {
        if (heading === void 0) return this._helpGroupHeading ?? "";
        this._helpGroupHeading = heading;
        return this;
      }
      /**
       * Set/get the default help group heading for subcommands added to this command.
       * (This does not override a group set directly on the subcommand using .helpGroup().)
       *
       * @example
       * program.commandsGroup('Development Commands:);
       * program.command('watch')...
       * program.command('lint')...
       * ...
       *
       * @param {string} [heading]
       * @returns {Command | string}
       */
      commandsGroup(heading) {
        if (heading === void 0) return this._defaultCommandGroup ?? "";
        this._defaultCommandGroup = heading;
        return this;
      }
      /**
       * Set/get the default help group heading for options added to this command.
       * (This does not override a group set directly on the option using .helpGroup().)
       *
       * @example
       * program
       *   .optionsGroup('Development Options:')
       *   .option('-d, --debug', 'output extra debugging')
       *   .option('-p, --profile', 'output profiling information')
       *
       * @param {string} [heading]
       * @returns {Command | string}
       */
      optionsGroup(heading) {
        if (heading === void 0) return this._defaultOptionGroup ?? "";
        this._defaultOptionGroup = heading;
        return this;
      }
      /**
       * @param {Option} option
       * @private
       */
      _initOptionGroup(option) {
        if (this._defaultOptionGroup && !option.helpGroupHeading)
          option.helpGroup(this._defaultOptionGroup);
      }
      /**
       * @param {Command} cmd
       * @private
       */
      _initCommandGroup(cmd) {
        if (this._defaultCommandGroup && !cmd.helpGroup())
          cmd.helpGroup(this._defaultCommandGroup);
      }
      /**
       * Set the name of the command from script filename, such as process.argv[1],
       * or require.main.filename, or __filename.
       *
       * (Used internally and public although not documented in README.)
       *
       * @example
       * program.nameFromFilename(require.main.filename);
       *
       * @param {string} filename
       * @return {Command}
       */
      nameFromFilename(filename) {
        this._name = path7.basename(filename, path7.extname(filename));
        return this;
      }
      /**
       * Get or set the directory for searching for executable subcommands of this command.
       *
       * @example
       * program.executableDir(__dirname);
       * // or
       * program.executableDir('subcommands');
       *
       * @param {string} [path]
       * @return {(string|null|Command)}
       */
      executableDir(path8) {
        if (path8 === void 0) return this._executableDir;
        this._executableDir = path8;
        return this;
      }
      /**
       * Return program help documentation.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
       * @return {string}
       */
      helpInformation(contextOptions) {
        const helper = this.createHelp();
        const context = this._getOutputContext(contextOptions);
        helper.prepareContext({
          error: context.error,
          helpWidth: context.helpWidth,
          outputHasColors: context.hasColors
        });
        const text = helper.formatHelp(this, helper);
        if (context.hasColors) return text;
        return this._outputConfiguration.stripColor(text);
      }
      /**
       * @typedef HelpContext
       * @type {object}
       * @property {boolean} error
       * @property {number} helpWidth
       * @property {boolean} hasColors
       * @property {function} write - includes stripColor if needed
       *
       * @returns {HelpContext}
       * @private
       */
      _getOutputContext(contextOptions) {
        contextOptions = contextOptions || {};
        const error = !!contextOptions.error;
        let baseWrite;
        let hasColors;
        let helpWidth;
        if (error) {
          baseWrite = (str) => this._outputConfiguration.writeErr(str);
          hasColors = this._outputConfiguration.getErrHasColors();
          helpWidth = this._outputConfiguration.getErrHelpWidth();
        } else {
          baseWrite = (str) => this._outputConfiguration.writeOut(str);
          hasColors = this._outputConfiguration.getOutHasColors();
          helpWidth = this._outputConfiguration.getOutHelpWidth();
        }
        const write = (str) => {
          if (!hasColors) str = this._outputConfiguration.stripColor(str);
          return baseWrite(str);
        };
        return { error, write, hasColors, helpWidth };
      }
      /**
       * Output help information for this command.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      outputHelp(contextOptions) {
        let deprecatedCallback;
        if (typeof contextOptions === "function") {
          deprecatedCallback = contextOptions;
          contextOptions = void 0;
        }
        const outputContext = this._getOutputContext(contextOptions);
        const eventContext = {
          error: outputContext.error,
          write: outputContext.write,
          command: this
        };
        this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
        this.emit("beforeHelp", eventContext);
        let helpInformation = this.helpInformation({ error: outputContext.error });
        if (deprecatedCallback) {
          helpInformation = deprecatedCallback(helpInformation);
          if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
            throw new Error("outputHelp callback must return a string or a Buffer");
          }
        }
        outputContext.write(helpInformation);
        if (this._getHelpOption()?.long) {
          this.emit(this._getHelpOption().long);
        }
        this.emit("afterHelp", eventContext);
        this._getCommandAndAncestors().forEach(
          (command) => command.emit("afterAllHelp", eventContext)
        );
      }
      /**
       * You can pass in flags and a description to customise the built-in help option.
       * Pass in false to disable the built-in help option.
       *
       * @example
       * program.helpOption('-?, --help' 'show help'); // customise
       * program.helpOption(false); // disable
       *
       * @param {(string | boolean)} flags
       * @param {string} [description]
       * @return {Command} `this` command for chaining
       */
      helpOption(flags, description) {
        if (typeof flags === "boolean") {
          if (flags) {
            if (this._helpOption === null) this._helpOption = void 0;
            if (this._defaultOptionGroup) {
              this._initOptionGroup(this._getHelpOption());
            }
          } else {
            this._helpOption = null;
          }
          return this;
        }
        this._helpOption = this.createOption(
          flags ?? "-h, --help",
          description ?? "display help for command"
        );
        if (flags || description) this._initOptionGroup(this._helpOption);
        return this;
      }
      /**
       * Lazy create help option.
       * Returns null if has been disabled with .helpOption(false).
       *
       * @returns {(Option | null)} the help option
       * @package
       */
      _getHelpOption() {
        if (this._helpOption === void 0) {
          this.helpOption(void 0, void 0);
        }
        return this._helpOption;
      }
      /**
       * Supply your own option to use for the built-in help option.
       * This is an alternative to using helpOption() to customise the flags and description etc.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addHelpOption(option) {
        this._helpOption = option;
        this._initOptionGroup(option);
        return this;
      }
      /**
       * Output help information and exit.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      help(contextOptions) {
        this.outputHelp(contextOptions);
        let exitCode = Number(process2.exitCode ?? 0);
        if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
          exitCode = 1;
        }
        this._exit(exitCode, "commander.help", "(outputHelp)");
      }
      /**
       * // Do a little typing to coordinate emit and listener for the help text events.
       * @typedef HelpTextEventContext
       * @type {object}
       * @property {boolean} error
       * @property {Command} command
       * @property {function} write
       */
      /**
       * Add additional text to be displayed with the built-in help.
       *
       * Position is 'before' or 'after' to affect just this command,
       * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
       *
       * @param {string} position - before or after built-in help
       * @param {(string | Function)} text - string to add, or a function returning a string
       * @return {Command} `this` command for chaining
       */
      addHelpText(position, text) {
        const allowedValues = ["beforeAll", "before", "after", "afterAll"];
        if (!allowedValues.includes(position)) {
          throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        const helpEvent = `${position}Help`;
        this.on(helpEvent, (context) => {
          let helpStr;
          if (typeof text === "function") {
            helpStr = text({ error: context.error, command: context.command });
          } else {
            helpStr = text;
          }
          if (helpStr) {
            context.write(`${helpStr}
`);
          }
        });
        return this;
      }
      /**
       * Output help information if help flags specified
       *
       * @param {Array} args - array of options to search for help flags
       * @private
       */
      _outputHelpIfRequested(args) {
        const helpOption = this._getHelpOption();
        const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
        if (helpRequested) {
          this.outputHelp();
          this._exit(0, "commander.helpDisplayed", "(outputHelp)");
        }
      }
    };
    function incrementNodeInspectorPort(args) {
      return args.map((arg) => {
        if (!arg.startsWith("--inspect")) {
          return arg;
        }
        let debugOption;
        let debugHost = "127.0.0.1";
        let debugPort = "9229";
        let match;
        if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
          debugOption = match[1];
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
          debugOption = match[1];
          if (/^\d+$/.test(match[3])) {
            debugPort = match[3];
          } else {
            debugHost = match[3];
          }
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
          debugOption = match[1];
          debugHost = match[3];
          debugPort = match[4];
        }
        if (debugOption && debugPort !== "0") {
          return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
        }
        return arg;
      });
    }
    function useColor() {
      if (process2.env.NO_COLOR || process2.env.FORCE_COLOR === "0" || process2.env.FORCE_COLOR === "false")
        return false;
      if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== void 0)
        return true;
      return void 0;
    }
    exports2.Command = Command2;
    exports2.useColor = useColor;
  }
});

// node_modules/commander/index.js
var require_commander = __commonJS({
  "node_modules/commander/index.js"(exports2) {
    var { Argument: Argument2 } = require_argument();
    var { Command: Command2 } = require_command();
    var { CommanderError: CommanderError2, InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var { Help: Help2 } = require_help();
    var { Option: Option2 } = require_option();
    exports2.program = new Command2();
    exports2.createCommand = (name) => new Command2(name);
    exports2.createOption = (flags, description) => new Option2(flags, description);
    exports2.createArgument = (name, description) => new Argument2(name, description);
    exports2.Command = Command2;
    exports2.Option = Option2;
    exports2.Argument = Argument2;
    exports2.Help = Help2;
    exports2.CommanderError = CommanderError2;
    exports2.InvalidArgumentError = InvalidArgumentError2;
    exports2.InvalidOptionArgumentError = InvalidArgumentError2;
  }
});

// node_modules/commander/esm.mjs
var import_index = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  // deprecated old name
  Command,
  Argument,
  Option,
  Help
} = import_index.default;

// src/utils/repo/locator.ts
var import_child_process = require("child_process");
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
function getCurrentWorkingDir() {
  const projectDir = process.env.CLAUDE_PROJECT_DIR;
  if (projectDir) {
    return projectDir;
  }
  return process.cwd();
}
async function locateRepo() {
  console.log("\u{1F50D} \u6B65\u9AA41: \u5B9A\u4F4D\u4ED3\u5E93...\n");
  const cwd = getCurrentWorkingDir();
  console.log(`[debug] \u5F53\u524D\u5DE5\u4F5C\u76EE\u5F55: ${cwd}`);
  const gitInfo = await tryGetGitRepo(cwd);
  if (gitInfo) {
    console.log(`\u2705 \u901A\u8FC7 Git \u8BC6\u522B\u4ED3\u5E93:`);
    console.log(`   - \u6240\u6709\u8005: ${gitInfo.owner || "\u672A\u77E5"}`);
    console.log(`   - \u4ED3\u5E93\u540D: ${gitInfo.name}`);
    console.log(`   - \u5206\u652F: ${gitInfo.branch || "\u672A\u77E5"}`);
    console.log(`   - \u8DEF\u5F84: ${gitInfo.path}
`);
    return gitInfo;
  }
  const pathInfo = await tryInferFromPath(cwd);
  if (pathInfo) {
    console.log(`\u2705 \u901A\u8FC7\u8DEF\u5F84\u8BC6\u522B\u4ED3\u5E93:`);
    console.log(`   - \u76EE\u5F55\u540D: ${pathInfo.name}`);
    console.log(`   - \u8DEF\u5F84: ${pathInfo.path}
`);
    return pathInfo;
  }
  console.log("\u26A0\uFE0F  \u65E0\u6CD5\u81EA\u52A8\u8BC6\u522B\u4ED3\u5E93\u4FE1\u606F");
  console.log(`   \u4F7F\u7528\u5F53\u524D\u76EE\u5F55: ${cwd}
`);
  return {
    type: "manual",
    path: cwd,
    name: import_path.default.basename(cwd)
  };
}
async function tryGetGitRepo(cwd) {
  try {
    const gitRoot = (0, import_child_process.execSync)("git rev-parse --show-toplevel", {
      cwd,
      encoding: "utf-8",
      stdio: "pipe"
    }).trim();
    let remoteUrl = "";
    let owner = "";
    let repoName = "";
    try {
      remoteUrl = (0, import_child_process.execSync)("git remote get-url origin", {
        cwd,
        encoding: "utf-8",
        stdio: "pipe"
      }).trim();
      const sshMatch = remoteUrl.match(/git@[\w.-]+:([\w-]+)\/([\w.-]+)\.git/);
      const httpsMatch = remoteUrl.match(/https?:\/\/[\w.-]+\/([\w-]+)\/([\w.-]+)(\.git)?/);
      if (sshMatch) {
        owner = sshMatch[1];
        repoName = sshMatch[2];
      } else if (httpsMatch) {
        owner = httpsMatch[1];
        repoName = httpsMatch[2];
      }
    } catch {
      repoName = import_path.default.basename(gitRoot);
    }
    let branch = "";
    try {
      branch = (0, import_child_process.execSync)("git rev-parse --abbrev-ref HEAD", {
        cwd,
        encoding: "utf-8",
        stdio: "pipe"
      }).trim();
    } catch {
    }
    let commit = "";
    try {
      commit = (0, import_child_process.execSync)("git rev-parse HEAD", {
        cwd,
        encoding: "utf-8",
        stdio: "pipe"
      }).trim().substring(0, 8);
    } catch {
    }
    return {
      type: "git",
      owner,
      name: repoName,
      remote: remoteUrl,
      branch,
      commit,
      path: gitRoot
    };
  } catch {
    return null;
  }
}
async function tryInferFromPath(cwd) {
  if (!import_fs.default.existsSync(cwd)) {
    return null;
  }
  const dirName = import_path.default.basename(cwd);
  let currentPath = cwd;
  let gitRoot = null;
  for (let i = 0; i < 5; i++) {
    const gitDir = import_path.default.join(currentPath, ".git");
    if (import_fs.default.existsSync(gitDir)) {
      gitRoot = currentPath;
      break;
    }
    const parent = import_path.default.dirname(currentPath);
    if (parent === currentPath) {
      break;
    }
    currentPath = parent;
  }
  return {
    type: gitRoot ? "git" : "path",
    name: dirName,
    path: cwd
  };
}

// src/utils/fs/init.ts
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var DEFAULT_CONFIG = {
  repo_plan: {
    prefer_local: true,
    verify_mode: "smart"
  },
  repotalk: {
    timeout_ms: 5e4
  }
};
async function initDirectories(repoPath) {
  console.log("\n\u{1F4C1} \u6B65\u9AA42: \u521D\u59CB\u5316\u76EE\u5F55\u7ED3\u6784...\n");
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  if (!homeDir) {
    throw new Error("\u65E0\u6CD5\u786E\u5B9A\u7528\u6237\u4E3B\u76EE\u5F55");
  }
  const userDir = import_path2.default.join(homeDir, ".bytecoding");
  ensureDir(userDir);
  const userCacheDir = import_path2.default.join(userDir, "cache");
  const userChangesDir = import_path2.default.join(userDir, "changes");
  const userArchiveDir = import_path2.default.join(userDir, "archive");
  const userIndexDir = import_path2.default.join(userDir, "index");
  ensureDir(userCacheDir);
  ensureDir(userChangesDir);
  ensureDir(userArchiveDir);
  ensureDir(userIndexDir);
  console.log(`\u2705 \u7528\u6237\u7EA7\u76EE\u5F55: ${userDir}`);
  const configFile = import_path2.default.join(userDir, "config.json");
  await ensureConfigFile(configFile);
  const projectDir = import_path2.default.join(repoPath, ".bytecoding");
  ensureDir(projectDir);
  const projectChangesDir = import_path2.default.join(projectDir, "changes");
  const projectArchiveDir = import_path2.default.join(projectDir, "archive");
  ensureDir(projectChangesDir);
  ensureDir(projectArchiveDir);
  console.log(`\u2705 \u9879\u76EE\u7EA7\u76EE\u5F55: ${projectDir}`);
  console.log(`   (\u5DF2\u6DFB\u52A0\u5230 .gitignore)
`);
  const planId = `plan-${Date.now()}`;
  const planDir = import_path2.default.join(projectChangesDir, planId);
  ensureDir(planDir);
  console.log(`\u2705 \u8BA1\u5212\u76EE\u5F55: ${planDir}`);
  console.log(`   \u8BA1\u5212 ID: ${planId}
`);
  const logFile = import_path2.default.join(planDir, "log");
  initLogFile(logFile, planId, repoPath);
  return { userDir, projectDir, planDir, planId, logFile };
}
function ensureDir(dir) {
  if (!import_fs2.default.existsSync(dir)) {
    import_fs2.default.mkdirSync(dir, { recursive: true });
  }
}
async function ensureConfigFile(configPath) {
  if (!import_fs2.default.existsSync(configPath)) {
    const config = DEFAULT_CONFIG;
    import_fs2.default.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    console.log(`\u2705 \u521B\u5EFA\u9ED8\u8BA4\u914D\u7F6E: ${configPath}`);
  } else {
    try {
      const content = import_fs2.default.readFileSync(configPath, "utf-8");
      JSON.parse(content);
    } catch (error) {
      console.warn(`\u26A0\uFE0F  \u914D\u7F6E\u6587\u4EF6\u683C\u5F0F\u9519\u8BEF\uFF0C\u5C06\u4F7F\u7528\u9ED8\u8BA4\u914D\u7F6E`);
      const backupPath = `${configPath}.backup`;
      import_fs2.default.copyFileSync(configPath, backupPath);
      import_fs2.default.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
      console.log(`\u2705 \u5DF2\u5907\u4EFD\u635F\u574F\u7684\u914D\u7F6E\u5E76\u6062\u590D\u9ED8\u8BA4\u503C: ${backupPath}`);
    }
  }
}
function initLogFile(logPath, planId, repoPath) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const header = `[${timestamp}] [INFO] [main] \u8BA1\u5212\u5F00\u59CB: ${planId}
`;
  const repoInfo = `[${timestamp}] [INFO] [main] \u4ED3\u5E93\u8DEF\u5F84: ${repoPath}
`;
  const separator = "\n";
  import_fs2.default.writeFileSync(logPath, header + repoInfo + separator, "utf-8");
}

// src/utils/llm/refiner.ts
var import_fs4 = __toESM(require("fs"), 1);
var import_path4 = __toESM(require("path"), 1);

// src/utils/claude-cli/api.ts
var import_child_process2 = require("child_process");
async function claude(options) {
  const startTime = Date.now();
  try {
    const claudeAvailable = checkClaudeAvailable();
    if (!claudeAvailable) {
      return {
        success: false,
        error: "claude \u547D\u4EE4\u4E0D\u53EF\u7528\uFF0C\u8BF7\u786E\u4FDD\u5DF2\u5B89\u88C5 Claude Code CLI"
      };
    }
    const command = buildCommand(options);
    const output = execCommand(command, {
      cwd: options.workingDirectory || process.cwd(),
      timeout: options.timeout || 12e4
      // 默认 2 分钟
    });
    const result = parseOutput(output, options.outputFormat || "text");
    result.command = command;
    const duration = Date.now() - startTime;
    console.log(`\u2705 Claude CLI \u8C03\u7528\u6210\u529F (\u8017\u65F6: ${duration}ms)`);
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\u274C Claude CLI \u8C03\u7528\u5931\u8D25: ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
      command: buildCommand(options)
    };
  }
}
function checkClaudeAvailable() {
  try {
    (0, import_child_process2.execSync)("claude --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
function buildCommand(options) {
  const parts = ["claude", "-p"];
  if (options.outputFormat) {
    parts.push(`--output-format`, options.outputFormat);
  }
  if (options.model) {
    parts.push(`--model`, options.model);
  }
  if (options.systemPromptFile) {
    parts.push(`--system-prompt-file`, options.systemPromptFile);
  } else if (options.systemPrompt) {
    parts.push(`--system-prompt`, escapeShellArg(options.systemPrompt));
  } else if (options.appendSystemPrompt) {
    parts.push(`--append-system-prompt`, escapeShellArg(options.appendSystemPrompt));
  }
  if (options.allowedTools && options.allowedTools.length > 0) {
    parts.push(`--allowedTools`, `"${options.allowedTools.join(" ")}"`);
  }
  if (options.disallowedTools && options.disallowedTools.length > 0) {
    parts.push(`--disallowedTools`, `"${options.disallowedTools.join(" ")}"`);
  }
  if (options.maxTurns) {
    parts.push(`--max-turns`, String(options.maxTurns));
  }
  if (options.verbose) {
    parts.push(`--verbose`);
  }
  parts.push(escapeShellArg(options.prompt));
  return parts.join(" ");
}
function execCommand(command, options) {
  try {
    const output = (0, import_child_process2.execSync)(command, {
      cwd: options.cwd,
      timeout: options.timeout,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 10 * 1024 * 1024
      // 10MB
    });
    return output;
  } catch (error) {
    if (error.signal === "SIGTERM" || error.signal === "SIGKILL") {
      throw new Error(`\u547D\u4EE4\u6267\u884C\u8D85\u65F6\uFF08${options.timeout}ms\uFF09`);
    }
    const stderr = error.stderr || "";
    throw new Error(`\u547D\u4EE4\u6267\u884C\u5931\u8D25: ${stderr || error.message}`);
  }
}
function parseOutput(rawOutput, format) {
  const trimmed = rawOutput.trim();
  if (format === "json") {
    try {
      const data = JSON.parse(trimmed);
      return { success: true, data };
    } catch (error) {
      const lastJson = extractLastJson(trimmed);
      if (lastJson) {
        return { success: true, data: lastJson };
      }
      return {
        success: true,
        output: trimmed,
        error: "JSON \u89E3\u6790\u5931\u8D25\uFF0C\u8FD4\u56DE\u539F\u59CB\u6587\u672C"
      };
    }
  }
  if (format === "stream-json") {
    const lines = trimmed.split("\n");
    const lastLine = lines[lines.length - 1];
    try {
      const data = JSON.parse(lastLine);
      return { success: true, data };
    } catch {
      return { success: true, output: trimmed };
    }
  }
  return { success: true, output: trimmed };
}
function extractLastJson(text) {
  const lastOpenBrace = text.lastIndexOf("{");
  const lastCloseBrace = text.lastIndexOf("}");
  if (lastOpenBrace !== -1 && lastCloseBrace !== -1 && lastCloseBrace > lastOpenBrace) {
    try {
      const jsonStr = text.substring(lastOpenBrace, lastCloseBrace + 1);
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }
  return null;
}
function escapeShellArg(arg) {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
async function claudeText(prompt, options) {
  const result = await claude({
    prompt,
    outputFormat: "text",
    ...options
  });
  if (!result.success) {
    throw new Error(result.error || "Claude CLI \u8C03\u7528\u5931\u8D25");
  }
  return result.output || "";
}

// src/utils/logger/index.ts
var import_fs3 = __toESM(require("fs"), 1);
var import_path3 = __toESM(require("path"), 1);
function createLogger(options) {
  const logFile = import_path3.default.join(options.logDir, "log");
  return {
    /**
     * 记录信息日志
     */
    info(category, message) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const logLine = `[${timestamp}] [INFO] [${category}] ${message}
`;
      writeLog(logFile, logLine);
    },
    /**
     * 记录错误日志
     */
    error(category, message, error) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const logLine = `[${timestamp}] [ERROR] [${category}] ${message}`;
      const errorLine = error ? ` ${error.stack || error.message || error}` : "";
      writeLog(logFile, logLine + errorLine + "\n");
    },
    /**
     * 记录步骤开始
     */
    step(step, name) {
      this.info("step", `\u6B65\u9AA4${step}: ${name}`);
    },
    /**
     * 记录步骤完成
     */
    stepComplete(step, name, duration) {
      const durationStr = duration ? ` (\u8017\u65F6: ${duration}ms)` : "";
      this.info("step", `\u6B65\u9AA4${step}\u5B8C\u6210: ${name}${durationStr}`);
    }
  };
}
function writeLog(logFile, content) {
  try {
    import_fs3.default.appendFileSync(logFile, content);
  } catch (error) {
    console.error("\u5199\u5165\u65E5\u5FD7\u5931\u8D25:", error);
  }
}
var globalLogger = null;
function initLogger(logFile, planId) {
  globalLogger = createLogger({ logDir: import_path3.default.dirname(logFile), planId });
}
function getLogger() {
  if (!globalLogger) {
    throw new Error("Logger \u672A\u521D\u59CB\u5316\uFF0C\u8BF7\u5148\u8C03\u7528 initLogger()");
  }
  return globalLogger;
}
var log = {
  info: (category, message) => getLogger().info(category, message),
  error: (category, message, error) => getLogger().error(category, message, error),
  step: (step, name) => getLogger().step(step, name),
  stepComplete: (step, name, duration) => getLogger().stepComplete(step, name, duration)
};

// src/utils/llm/refiner.ts
async function refineRequirement(options) {
  console.log("\u{1F916} \u6B65\u9AA43: \u4F7F\u7528 LLM \u91CD\u7EC4\u9700\u6C42...\n");
  const log2 = getLogger();
  try {
    const userPrompt = buildUserPrompt(options);
    log2.info("llm", "\u6784\u5EFA LLM prompt");
    const systemPrompt = getSystemPromptContent();
    console.log("\u{1F4E4} \u6B63\u5728\u8C03\u7528 Claude CLI \u751F\u6210\u9700\u6C42\u6587\u6863...");
    log2.info("llm", "\u8C03\u7528 Claude CLI");
    const refinedContent = await claudeText(userPrompt, {
      systemPrompt,
      // 使用内联的系统提示词
      model: options.model || "sonnet",
      workingDirectory: options.repoInfo.path || process.cwd(),
      timeout: 12e4
      // 2 分钟
    });
    log2.info("llm", "Claude CLI \u8FD4\u56DE\u6210\u529F");
    const proposalPath = import_path4.default.join(options.outputDir, "proposal.md");
    import_fs4.default.writeFileSync(proposalPath, refinedContent, "utf-8");
    console.log(`\u2705 \u9700\u6C42\u6587\u6863\u5DF2\u751F\u6210: ${proposalPath}
`);
    log2.info("llm", `\u4FDD\u5B58 proposal.md: ${proposalPath}`);
    return { success: true, proposalPath };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`\u274C LLM \u91CD\u7EC4\u5931\u8D25: ${err.message}
`);
    log2.error("llm", "LLM \u91CD\u7EC4\u5931\u8D25", err);
    return { success: false, error: err };
  }
}
function buildUserPrompt(options) {
  const { repoInfo, rawInput, detailLevel } = options;
  const repoContext = buildRepoContext(repoInfo);
  const detailInstruction = getDetailInstruction(detailLevel || "standard");
  return `
\u8BF7\u91CD\u7EC4\u4EE5\u4E0B\u9700\u6C42\u4E3A\u7ED3\u6784\u5316\u7684\u6280\u672F\u9700\u6C42\u6587\u6863\u3002

${detailInstruction}

# \u539F\u59CB\u9700\u6C42

${rawInput}

# \u4ED3\u5E93\u4FE1\u606F

${repoContext}

\u8BF7\u4E25\u683C\u6309\u7167\u7CFB\u7EDF\u63D0\u793A\u8BCD\u4E2D\u5B9A\u4E49\u7684\u683C\u5F0F\u8F93\u51FA Markdown \u6587\u6863\u3002
`.trim();
}
function buildRepoContext(repoInfo) {
  const parts = [];
  if (repoInfo.name) {
    parts.push(`**\u4ED3\u5E93\u540D\u79F0**: ${repoInfo.name}`);
  }
  if (repoInfo.type === "git") {
    parts.push(`**\u7C7B\u578B**: Git \u4ED3\u5E93`);
    if (repoInfo.owner) {
      parts.push(`**\u6240\u6709\u8005**: ${repoInfo.owner}`);
    }
    if (repoInfo.remote) {
      parts.push(`**\u8FDC\u7A0B\u5730\u5740**: ${repoInfo.remote}`);
    }
    if (repoInfo.branch) {
      parts.push(`**\u5F53\u524D\u5206\u652F**: ${repoInfo.branch}`);
    }
    if (repoInfo.commit) {
      parts.push(`**\u5F53\u524D\u63D0\u4EA4**: ${repoInfo.commit}`);
    }
  } else if (repoInfo.type === "path") {
    parts.push(`**\u7C7B\u578B**: \u672C\u5730\u76EE\u5F55`);
  }
  if (repoInfo.path) {
    parts.push(`**\u672C\u5730\u8DEF\u5F84**: ${repoInfo.path}`);
  }
  return parts.map((line) => `- ${line}`).join("\n");
}
function getDetailInstruction(level) {
  switch (level) {
    case "simple":
      return `
**\u8BE6\u7EC6\u7A0B\u5EA6**: \u7B80\u6D01\u7248

\u8BF7\u751F\u6210\u7B80\u6D01\u7684\u9700\u6C42\u6587\u6863\uFF0C\u5305\u542B\uFF1A
- \u9700\u6C42\u6807\u9898
- \u80CC\u666F\u4E0E\u76EE\u6807\uFF081-2 \u6BB5\uFF09
- \u6838\u5FC3\u529F\u80FD\u9700\u6C42\uFF08\u4EC5\u5217\u51FA\u4E3B\u8981\u529F\u80FD\uFF09
- \u7B80\u8981\u7684\u6280\u672F\u65B9\u6848\u5EFA\u8BAE

\u53EF\u4EE5\u7701\u7565\u6216\u7B80\u5316\uFF1A\u975E\u529F\u80FD\u9700\u6C42\u3001\u591A\u4E2A\u65B9\u6848\u5BF9\u6BD4\u3001\u5B9E\u65BD\u8003\u8651\u7B49\u90E8\u5206\u3002
`.trim();
    case "detailed":
      return `
**\u8BE6\u7EC6\u7A0B\u5EA6**: \u8BE6\u7EC6\u7248

\u8BF7\u751F\u6210\u5B8C\u6574\u8BE6\u7EC6\u7684\u9700\u6C42\u6587\u6863\uFF0C\u5305\u542B\u7CFB\u7EDF\u63D0\u793A\u8BCD\u4E2D\u5B9A\u4E49\u7684\u6240\u6709\u90E8\u5206\uFF0C\u5E76\u4E14\uFF1A
- \u529F\u80FD\u9700\u6C42\u9700\u8981\u5305\u542B\u8BE6\u7EC6\u7684\u63CF\u8FF0\u3001\u9A8C\u6536\u6807\u51C6\u3001\u4F9D\u8D56\u5173\u7CFB
- \u975E\u529F\u80FD\u9700\u6C42\u8981\u5C3D\u53EF\u80FD\u5168\u9762\uFF08\u6027\u80FD\u3001\u5B89\u5168\u3001\u53EF\u7EF4\u62A4\u6027\u3001\u517C\u5BB9\u6027\u7B49\uFF09
- \u6280\u672F\u65B9\u6848\u8981\u63D0\u4F9B 2-3 \u4E2A\u9009\u9879\u5E76\u8FDB\u884C\u8BE6\u7EC6\u5BF9\u6BD4
- \u5B9E\u65BD\u8003\u8651\u8981\u5305\u542B\u98CE\u9669\u8BC4\u4F30\u3001\u4F9D\u8D56\u670D\u52A1\u3001\u6570\u636E\u8FC1\u79FB\u3001\u6D4B\u8BD5\u7B56\u7565\u7B49
- \u9A8C\u6536\u6807\u51C6\u8981\u5177\u4F53\u53EF\u91CF\u5316
`.trim();
    case "standard":
    default:
      return `
**\u8BE6\u7EC6\u7A0B\u5EA6**: \u6807\u51C6\u7248

\u8BF7\u751F\u6210\u6807\u51C6\u683C\u5F0F\u7684\u9700\u6C42\u6587\u6863\uFF0C\u5305\u542B\u7CFB\u7EDF\u63D0\u793A\u8BCD\u4E2D\u5B9A\u4E49\u7684\u4E3B\u8981\u90E8\u5206\u3002
\u529F\u80FD\u9700\u6C42\u805A\u7126\u6838\u5FC3\u9700\u6C42\uFF0C\u6280\u672F\u65B9\u6848\u63D0\u4F9B\u63A8\u8350\u65B9\u6848\u53CA\u7B80\u8981\u5BF9\u6BD4\u3002
`.trim();
  }
}
function getSystemPromptContent() {
  return `\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u9700\u6C42\u5206\u6790\u5E08\uFF0C\u8D1F\u8D23\u5C06\u7528\u6237\u7684\u539F\u59CB\u9700\u6C42\u91CD\u7EC4\u4E3A\u7ED3\u6784\u5316\u7684\u6280\u672F\u9700\u6C42\u6587\u6863\u3002

# \u4F60\u7684\u4EFB\u52A1

1. **\u7406\u89E3\u9700\u6C42**\uFF1A\u6DF1\u5165\u7406\u89E3\u7528\u6237\u7684\u771F\u5B9E\u610F\u56FE\uFF0C\u8BC6\u522B\u6838\u5FC3\u9700\u6C42\u548C\u8FB9\u754C\u6761\u4EF6
2. **\u8865\u5145\u4E0A\u4E0B\u6587**\uFF1A\u57FA\u4E8E\u4ED3\u5E93\u4FE1\u606F\uFF0C\u63A8\u65AD\u6280\u672F\u6808\u3001\u67B6\u6784\u6A21\u5F0F\u7B49\u4E0A\u4E0B\u6587
3. **\u7ED3\u6784\u5316\u8F93\u51FA**\uFF1A\u6309\u7167\u6307\u5B9A\u683C\u5F0F\u751F\u6210 Markdown \u6587\u6863

# \u8F93\u51FA\u683C\u5F0F

\u8BF7\u4E25\u683C\u6309\u7167\u4EE5\u4E0B\u683C\u5F0F\u8F93\u51FA\uFF1A

\`\`\`markdown
# \u9700\u6C42\u6807\u9898

## \u80CC\u666F\u4E0E\u76EE\u6807

[\u63CF\u8FF0\u9700\u6C42\u7684\u80CC\u666F\u3001\u52A8\u673A\u548C\u8981\u8FBE\u6210\u7684\u76EE\u6807]

## \u73B0\u72B6\u5206\u6790

[\u5206\u6790\u5F53\u524D\u7CFB\u7EDF\u7684\u76F8\u5173\u90E8\u5206\uFF0C\u8BC6\u522B\u9700\u8981\u4FEE\u6539\u7684\u70B9]

## \u529F\u80FD\u9700\u6C42

### \u9700\u6C42 1: [\u6807\u9898]
- **\u63CF\u8FF0**: [\u8BE6\u7EC6\u63CF\u8FF0]
- **\u4F18\u5148\u7EA7**: high/medium/low
- **\u4F9D\u8D56**: [\u5176\u4ED6\u9700\u6C42\u6216\u5916\u90E8\u4F9D\u8D56]

### \u9700\u6C42 2: [\u6807\u9898]
...

## \u975E\u529F\u80FD\u9700\u6C42

### \u6027\u80FD\u8981\u6C42
[\u5217\u51FA\u6027\u80FD\u76F8\u5173\u7684\u7EA6\u675F\u548C\u8981\u6C42]

### \u5B89\u5168\u8981\u6C42
[\u5217\u51FA\u5B89\u5168\u76F8\u5173\u7684\u7EA6\u675F\u548C\u8981\u6C42]

### \u53EF\u7EF4\u62A4\u6027\u8981\u6C42
[\u5217\u51FA\u53EF\u7EF4\u62A4\u6027\u76F8\u5173\u7684\u7EA6\u675F\u548C\u8981\u6C42]

## \u6280\u672F\u65B9\u6848\u5EFA\u8BAE

### \u65B9\u6848\u9009\u9879

#### \u9009\u9879 1: [\u65B9\u6848\u540D\u79F0]
- **\u63CF\u8FF0**: [\u7B80\u8981\u63CF\u8FF0]
- **\u4F18\u52BF**: [\u5217\u51FA\u4F18\u52BF]
- **\u98CE\u9669**: [\u5217\u51FA\u98CE\u9669]

#### \u9009\u9879 2: [\u65B9\u6848\u540D\u79F0]
...

### \u63A8\u8350\u65B9\u6848
[\u7ED9\u51FA\u63A8\u8350\u65B9\u6848\u53CA\u7406\u7531]

## \u5B9E\u65BD\u8003\u8651

### \u6280\u672F\u98CE\u9669
[\u5217\u51FA\u53EF\u80FD\u7684\u6280\u672F\u98CE\u9669]

### \u4F9D\u8D56\u670D\u52A1
[\u5217\u51FA\u4F9D\u8D56\u7684\u5916\u90E8\u670D\u52A1\u6216\u7EC4\u4EF6]

### \u6570\u636E\u8FC1\u79FB
[\u5982\u679C\u6D89\u53CA\u6570\u636E\u53D8\u66F4\uFF0C\u8BF4\u660E\u8FC1\u79FB\u65B9\u6848]

## \u9A8C\u6536\u6807\u51C6

[\u5217\u51FA\u660E\u786E\u7684\u9A8C\u6536\u6807\u51C6\uFF0C\u4FBF\u4E8E\u540E\u7EED\u9A8C\u8BC1]

## \u9644\u5F55

### \u53C2\u8003\u8D44\u6599
[\u5217\u51FA\u76F8\u5173\u7684\u53C2\u8003\u6587\u6863\u6216\u94FE\u63A5]

### \u672F\u8BED\u8868
[\u89E3\u91CA\u6587\u6863\u4E2D\u4F7F\u7528\u7684\u4E13\u4E1A\u672F\u8BED]
\`\`\`

# \u6CE8\u610F\u4E8B\u9879

1. **\u4FDD\u6301\u7B80\u6D01**\uFF1A\u907F\u514D\u5197\u4F59\uFF0C\u6BCF\u4E2A\u90E8\u5206\u90FD\u5E94\u6709\u5B9E\u8D28\u6027\u5185\u5BB9
2. **\u6280\u672F\u53EF\u884C**\uFF1A\u63D0\u51FA\u7684\u65B9\u6848\u5E94\u8BE5\u662F\u6280\u672F\u53EF\u884C\u7684
3. **\u660E\u786E\u4F18\u5148\u7EA7**\uFF1A\u5E2E\u52A9\u5B9E\u65BD\u8005\u7406\u89E3\u54EA\u4E9B\u662F\u6838\u5FC3\u9700\u6C42
4. **\u8003\u8651\u6269\u5C55\u6027**\uFF1A\u5728\u5408\u7406\u8303\u56F4\u5185\u8003\u8651\u672A\u6765\u7684\u6269\u5C55\u9700\u6C42
5. **\u4F7F\u7528\u4E2D\u6587**\uFF1A\u9664\u975E\u662F\u4E13\u6709\u540D\u8BCD\uFF0C\u5426\u5219\u4F7F\u7528\u4E2D\u6587\u8868\u8FF0

# \u4ED3\u5E93\u4FE1\u606F

\u4F60\u5C06\u6536\u5230\u4ED3\u5E93\u4FE1\u606F\u4F5C\u4E3A\u989D\u5916\u4E0A\u4E0B\u6587\uFF0C\u5305\u62EC\uFF1A
- \u4ED3\u5E93\u540D\u79F0
- \u4ED3\u5E93\u7C7B\u578B\uFF08git/hg/svn\uFF09
- \u5F53\u524D\u5206\u652F
- \u5F53\u524D\u63D0\u4EA4
- \u4ED3\u5E93\u8DEF\u5F84

\u8BF7\u5229\u7528\u8FD9\u4E9B\u4FE1\u606F\u63A8\u65AD\u6280\u672F\u6808\u548C\u9879\u76EE\u7ED3\u6784\u3002`;
}

// src/utils/repotask/investigator.ts
var import_fs5 = __toESM(require("fs"), 1);
var import_path5 = __toESM(require("path"), 1);

// src/utils/mcp-repotalk/client.ts
var import_child_process3 = require("child_process");
var import_events = require("events");
var RepotalkClient = class extends import_events.EventEmitter {
  process = null;
  config;
  messageId = 0;
  pendingRequests = /* @__PURE__ */ new Map();
  isConnected = false;
  constructor(config = {}) {
    super();
    this.config = {
      command: config.command || "npx",
      args: config.args || ["-y", "@modelcontextprotocol/server-repotalk"],
      env: config.env || {},
      timeout: config.timeout || 3e4,
      debug: config.debug || false
    };
  }
  /**
   * 连接到 Repotalk MCP 服务器
   */
  async connect() {
    if (this.isConnected) {
      this.log("\u5DF2\u7ECF\u8FDE\u63A5\uFF0C\u8DF3\u8FC7\u91CD\u590D\u8FDE\u63A5");
      return;
    }
    return new Promise((resolve, reject) => {
      this.log("\u542F\u52A8 Repotalk MCP \u670D\u52A1\u5668...");
      this.log(`\u547D\u4EE4: ${this.config.command} ${this.config.args.join(" ")}`);
      this.process = (0, import_child_process3.spawn)(this.config.command, this.config.args, {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, ...this.config.env }
      });
      if (!this.process.stdout || !this.process.stdin || !this.process.stderr) {
        reject(new Error("\u65E0\u6CD5\u521B\u5EFA\u8FDB\u7A0B stdio"));
        return;
      }
      this.process.stdout.on("data", (data) => {
        this.handleResponse(data.toString());
      });
      this.process.stderr.on("data", (data) => {
        this.log(`stderr: ${data.toString()}`);
      });
      this.process.on("close", (code) => {
        this.log(`\u8FDB\u7A0B\u9000\u51FA\uFF0C\u4EE3\u7801: ${code}`);
        this.isConnected = false;
        this.rejectAllPending(new Error(`MCP \u670D\u52A1\u5668\u8FDB\u7A0B\u9000\u51FA (code: ${code})`));
      });
      this.process.on("error", (error) => {
        this.log(`\u8FDB\u7A0B\u9519\u8BEF: ${error.message}`);
        this.isConnected = false;
        reject(error);
      });
      setTimeout(() => {
        this.isConnected = true;
        this.log("\u5DF2\u8FDE\u63A5\u5230 Repotalk MCP \u670D\u52A1\u5668");
        resolve();
      }, 1e3);
    });
  }
  /**
   * 断开连接
   */
  async disconnect() {
    this.log("\u65AD\u5F00\u8FDE\u63A5...");
    this.rejectAllPending(new Error("\u5BA2\u6237\u7AEF\u5DF2\u65AD\u5F00\u8FDE\u63A5"));
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.isConnected = false;
    this.log("\u5DF2\u65AD\u5F00\u8FDE\u63A5");
  }
  /**
   * 调用 MCP 工具
   */
  async callTool(toolName, args) {
    if (!this.isConnected || !this.process?.stdin) {
      throw new Error("\u672A\u8FDE\u63A5\u5230 MCP \u670D\u52A1\u5668");
    }
    const id = ++this.messageId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`\u5DE5\u5177\u8C03\u7528\u8D85\u65F6: ${toolName}`));
      }, this.config.timeout);
      this.pendingRequests.set(id, { resolve, reject, timeout });
      const request = {
        jsonrpc: "2.0",
        id,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      };
      this.log(`\u53D1\u9001\u8BF7\u6C42 #${id}: ${toolName}`);
      this.process?.stdin?.write(JSON.stringify(request) + "\n");
    });
  }
  /**
   * 处理服务器响应
   */
  handleResponse(data) {
    const lines = data.split("\n").filter((line) => line.trim());
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        if (response.id !== void 0) {
          const pending = this.pendingRequests.get(response.id);
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingRequests.delete(response.id);
            if (response.error) {
              pending.reject(new Error(response.error.message || "\u672A\u77E5\u9519\u8BEF"));
            } else {
              pending.resolve(response.result);
            }
          }
        }
      } catch (error) {
        this.log(`\u89E3\u6790\u54CD\u5E94\u5931\u8D25: ${error}`);
      }
    }
  }
  /**
   * 拒绝所有待处理的请求
   */
  rejectAllPending(error) {
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }
  /**
   * 调试日志
   */
  log(message) {
    if (this.config.debug) {
      console.log(`[RepotalkClient] ${message}`);
    }
  }
  // ==================== Repotalk 工具方法 ====================
  /**
   * 获取仓库详细信息
   */
  async getReposDetail(repoNames) {
    const result = await this.callTool("get_repos_detail", {
      repo_names: repoNames
    });
    return result;
  }
  /**
   * 获取包详细信息
   */
  async getPackagesDetail(repoName, packageIds) {
    const result = await this.callTool("get_packages_detail", {
      repo_name: repoName,
      package_ids: packageIds
    });
    return result;
  }
  /**
   * 搜索节点（语义搜索）
   */
  async searchNodes(question, repoNames, packageIds) {
    const args = {
      question,
      repo_names: repoNames
    };
    if (packageIds && packageIds.length > 0) {
      args.package_ids = packageIds;
    }
    const result = await this.callTool("search_nodes", args);
    return result;
  }
  /**
   * 获取节点详细信息
   */
  async getNodesDetail(repoName, nodeIds, needRelatedCodes = false) {
    const result = await this.callTool("get_nodes_detail", {
      repo_name: repoName,
      node_ids: nodeIds,
      need_related_codes: needRelatedCodes
    });
    return result;
  }
  /**
   * 获取文件详细信息
   */
  async getFilesDetail(repoName, filePath) {
    const result = await this.callTool("get_files_detail", {
      repo_name: repoName,
      file_path: filePath
    });
    return result;
  }
  /**
   * 获取服务 API
   */
  async getServiceApis(repoName, apiNames) {
    const result = await this.callTool("get_service_apis", {
      repo_name: repoName,
      api_names: apiNames
    });
    return result;
  }
  /**
   * 获取 RPC 信息
   */
  async getRpcInfo(psm, method) {
    const args = { PSM: psm };
    if (method) {
      args.Method = method;
    }
    const result = await this.callTool("get_rpcinfo", args);
    return result;
  }
  /**
   * 基础设施搜索
   */
  async infraSearch(component, question) {
    const result = await this.callTool("infra_search", {
      component,
      question
    });
    return result;
  }
  /**
   * 获取资产文件
   */
  async getAssetFile(repoName, filePaths) {
    const result = await this.callTool("get_asset_file", {
      repo_name: repoName,
      file_paths: filePaths
    });
    return result;
  }
};

// src/utils/auth/repotalk.ts
var import_https = __toESM(require("https"), 1);
async function getRepotalkToken(config) {
  const log2 = getLogger();
  return new Promise((resolve, reject) => {
    const url = "https://cloud.bytedance.net/auth/api/v1/jwt";
    const timeout = config.timeout || 1e4;
    log2.info("auth", `\u83B7\u53D6 Repotalk Token: ${url}`);
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Cookie": `CAS_SESSION=${config.casSessionCookie}`
    };
    const req = import_https.default.request(url, {
      method: "GET",
      headers,
      timeout
    }, (res) => {
      const jwtToken = res.headers["x-jwt-token"];
      if (!jwtToken) {
        const error = new Error("\u54CD\u5E94\u5934\u4E2D\u672A\u627E\u5230 X-Jwt-Token");
        log2.error("auth", "\u83B7\u53D6 Token \u5931\u8D25", error);
        log2.info("auth", `\u54CD\u5E94\u5934: ${JSON.stringify(res.headers)}`);
        reject(error);
        return;
      }
      log2.info("auth", "\u6210\u529F\u83B7\u53D6 JWT Token");
      resolve(jwtToken);
      res.on("data", () => {
      });
      res.on("end", () => {
      });
    });
    req.on("error", (error) => {
      log2.error("auth", "\u8BF7\u6C42\u5931\u8D25", error);
      reject(new Error(`\u83B7\u53D6 Token \u5931\u8D25: ${error.message}`));
    });
    req.on("timeout", () => {
      req.destroy();
      log2.error("auth", "\u8BF7\u6C42\u8D85\u65F6");
      reject(new Error(`\u83B7\u53D6 Token \u8D85\u65F6\uFF08${timeout}ms\uFF09`));
    });
    req.end();
  });
}
function getCasSessionCookie(userDir) {
  try {
    const fs7 = require("fs");
    const path7 = require("path");
    const configPath = path7.join(userDir, "config.json");
    if (!fs7.existsSync(configPath)) {
      return void 0;
    }
    const config = JSON.parse(fs7.readFileSync(configPath, "utf-8"));
    return config.repotalk?.auth?.cas_session_cookie;
  } catch (error) {
    const log2 = getLogger();
    log2.error("auth", "\u8BFB\u53D6\u914D\u7F6E\u6587\u4EF6\u5931\u8D25", error);
    return void 0;
  }
}
function isValidCasSessionCookie(cookie) {
  if (!cookie) {
    return false;
  }
  const casSessionRegex = /^[a-f0-9]{32}$/i;
  return casSessionRegex.test(cookie);
}

// src/utils/mcp-repotalk/EXAMPLE.ts
async function createRepotalkClient(userDir, options) {
  const casSessionCookie = getCasSessionCookie(userDir);
  if (!isValidCasSessionCookie(casSessionCookie)) {
    throw new Error("\u65E0\u6548\u7684 CAS Session Cookie\uFF0C\u8BF7\u68C0\u67E5 ~/.bytecoding/config.json");
  }
  const jwtToken = await getRepotalkToken({ casSessionCookie });
  const client = new RepotalkClient({
    debug: options?.debug || false,
    command: "npx",
    args: [
      "--registry",
      "https://bnpm.byted.org",
      "-y",
      "@byted/mcp-proxy@latest"
    ],
    env: {
      MCP_SERVER_PSM: "bytedance.mcp.repotalk",
      MCP_GATEWAY_REGION: "CN",
      SERVICE_ACCOUNT_SECRET_KEY: "b16b7db2ae051b6e68970470c5ed2c1a",
      MCP_SERVER_CALL_TOOL_HEADERS: `x-jwt-token=${jwtToken}`
    }
  });
  return client;
}

// src/utils/fs/index.ts
function getUserDir() {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  if (!homeDir) {
    throw new Error("\u65E0\u6CD5\u786E\u5B9A\u7528\u6237\u4E3B\u76EE\u5F55");
  }
  return homeDir + "/.bytecoding";
}

// src/utils/repotask/investigator.ts
async function investigate(options) {
  console.log("\u{1F50E} \u6B65\u9AA44: Repotalk \u53D6\u8BC1...\n");
  const log2 = getLogger();
  let client = null;
  try {
    const proposal = await readProposal(options.proposalPath);
    log2.info("repotalk", "\u8BFB\u53D6 proposal.md");
    const targetRepo = options.rawInput ? resolveTargetRepo(options.rawInput, options.repoInfo) : options.repoInfo?.name || "unknown";
    log2.info("repotalk", `\u76EE\u6807\u4ED3\u5E93: ${targetRepo}`);
    const queries = await analyzeQueries(proposal, options.repoInfo, targetRepo, options.rawInput);
    console.log(`\u{1F4CB} \u6784\u5EFA ${queries.length} \u4E2A\u67E5\u8BE2`);
    log2.info("repotalk", `\u6784\u5EFA\u67E5\u8BE2\u7B56\u7565: ${queries.length} \u4E2A`);
    const userDir = options.userDir || getUserDir();
    client = await createRepotalkClient(userDir, { debug: false });
    await client.connect();
    log2.info("repotalk", "Repotalk MCP \u5BA2\u6237\u7AEF\u5DF2\u8FDE\u63A5");
    const results = await executeQueries(client, queries, targetRepo);
    const successCount = results.filter((r) => r.status === "success").length;
    console.log(`\u2705 \u5B8C\u6210 ${results.length} \u4E2A\u67E5\u8BE2 (${successCount} \u6210\u529F)
`);
    log2.info("repotalk", `\u6267\u884C\u67E5\u8BE2\u5B8C\u6210: ${successCount}/${results.length} \u6210\u529F`);
    const repotalkPath = await saveRepotalkResult(options.outputDir, results, proposal);
    console.log(`\u2705 \u53D6\u8BC1\u6587\u6863\u5DF2\u751F\u6210: ${repotalkPath}
`);
    log2.info("repotalk", `\u4FDD\u5B58 repotalk.md: ${repotalkPath}`);
    return {
      success: true,
      repotalkPath,
      queryCount: results.length,
      successCount
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`\u274C Repotalk \u53D6\u8BC1\u5931\u8D25: ${err.message}
`);
    log2.error("repotalk", "Repotalk \u53D6\u8BC1\u5931\u8D25", err);
    return { success: false, error: err };
  } finally {
    if (client) {
      await client.disconnect();
    }
  }
}
async function readProposal(filePath) {
  try {
    const content = import_fs5.default.readFileSync(filePath, "utf-8");
    return content;
  } catch (error) {
    throw new Error(`\u65E0\u6CD5\u8BFB\u53D6 proposal.md: ${error}`);
  }
}
function resolveTargetRepo(rawInput, repoInfo) {
  const patterns = [
    /(?:在|从|within)\s+([a-zA-Z][a-zA-Z0-9_-]+\/[a-zA-Z][a-zA-Z0-9_-]+)/,
    /([a-zA-Z][a-zA-Z0-9_-]+\/[a-zA-Z][a-zA-Z0-9_-]+)\s*(?:中|里|内|inside|in)/,
    /(?:repo|repository):\s*([a-zA-Z][a-zA-Z0-9_-]+\/[a-zA-Z][a-zA-Z0-9_-]+)/i
  ];
  for (const pattern of patterns) {
    const match = rawInput.match(pattern);
    if (match) {
      return match[1];
    }
  }
  if (repoInfo?.name) {
    return repoInfo.name;
  }
  if (repoInfo?.path) {
    const pathParts = repoInfo.path.split("/");
    for (let i = 0; i < pathParts.length - 1; i++) {
      const potentialRepo = `${pathParts[i]}/${pathParts[i + 1]}`;
      if (/^[a-z]+\/[a-z_]+$/.test(potentialRepo)) {
        return potentialRepo;
      }
    }
  }
  return repoInfo?.name || "unknown";
}
async function analyzeQueries(proposal, repoInfo, targetRepo, rawInput) {
  const queries = [];
  if (rawInput) {
    const cleanInput = rawInput.replace(/(?:在|从)\s+[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\s*(?:中|里|内)/g, "").replace(/(?:中|里|内|查找|搜索|找到|实现|代码)/g, "").trim();
    if (cleanInput) {
      queries.push({
        type: "code",
        query: cleanInput,
        priority: "high"
      });
    }
  }
  const descPattern = /-\s*\*\*描述\*\*:\s*([^\n]+?)(?=\n-?\s*\*|\n\n|$)/gs;
  let match;
  while ((match = descPattern.exec(proposal)) !== null) {
    const desc = match[1].trim();
    if (desc.length > 5 && !desc.startsWith("- **")) {
      queries.push({
        type: "code",
        query: desc,
        priority: "high"
      });
    }
  }
  const techTerms = extractTechTerms(proposal);
  for (const term of techTerms) {
    queries.push({
      type: "code",
      query: `\u641C\u7D22 ${term} \u76F8\u5173\u7684\u5B9E\u73B0\u4EE3\u7801`,
      priority: "medium"
    });
  }
  if (queries.length === 0) {
    queries.push({
      type: "code",
      query: "\u641C\u7D22\u6838\u5FC3\u4E1A\u52A1\u903B\u8F91\u4EE3\u7801",
      priority: "high"
    });
  }
  return queries;
}
function extractTechTerms(proposal) {
  const terms = [];
  const patterns = [
    // 服务名、PSM
    /[A-Z][a-z]+(?:\.[a-z]+)+/g,
    // 数据库表名 (t_xxx)
    /t_[a-z_]+/g,
    // RPC 方法
    /[A-Z][a-z]*Service\.[a-z][a-zA-Z]+/g,
    // 配置项
    /[a-z][a-z_]*\.[a-z_]+/g,
    // 接口路径
    /\/api\/v[0-9]+\/[a-z\/]+/g
  ];
  for (const pattern of patterns) {
    const matches = proposal.match(pattern);
    if (matches) {
      terms.push(...matches);
    }
  }
  return [...new Set(terms)].slice(0, 10);
}
async function executeQueries(client, queries, repoName) {
  const results = [];
  const highPriority = queries.filter((q) => q.priority === "high");
  const mediumPriority = queries.filter((q) => q.priority === "medium");
  const lowPriority = queries.filter((q) => q.priority === "low");
  for (const query of [...highPriority, ...mediumPriority, ...lowPriority]) {
    try {
      const result = await executeSingleQuery(client, query, repoName);
      results.push(result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      results.push({
        query: query.query,
        type: query.type,
        status: "error",
        message: err.message,
        evidence: []
      });
    }
  }
  return results;
}
async function executeSingleQuery(client, query, repoName) {
  switch (query.type) {
    case "code":
      return await executeCodeSearch(client, query.query, repoName);
    case "repo":
      return await executeRepoQuery(client, query.query, repoName);
    default:
      return {
        query: query.query,
        type: query.type,
        status: "pending",
        message: `\u4E0D\u652F\u6301\u7684\u67E5\u8BE2\u7C7B\u578B: ${query.type}`,
        evidence: []
      };
  }
}
async function executeCodeSearch(client, question, repoName) {
  const log2 = getLogger();
  try {
    log2.info("repotalk", `\u8C03\u7528 searchNodes, question="${question}", repoNames=[${repoName}]`);
    const searchResult = await client.searchNodes(question, [repoName]);
    log2.info("repotalk", `searchNodes \u8FD4\u56DE: matches=${searchResult.matches?.length || 0}`);
    if (!searchResult.matches || searchResult.matches.length === 0) {
      return {
        query: question,
        type: "code",
        status: "success",
        message: "\u672A\u627E\u5230\u76F8\u5173\u4EE3\u7801",
        evidence: []
      };
    }
    const topMatches = searchResult.matches.slice(0, 3);
    const nodeIds = topMatches.map((m) => m.node_id);
    log2.info("repotalk", `\u8C03\u7528 getNodesDetail, repoName=${repoName}, nodeIds=[${nodeIds.join(", ")}]`);
    const nodesDetail = await client.getNodesDetail(repoName, nodeIds, true);
    log2.info("repotalk", `getNodesDetail \u8FD4\u56DE: count=${nodesDetail.length}`);
    const evidence = [];
    for (const node of nodesDetail) {
      if (node.file_path && node.code) {
        evidence.push({
          file: node.file_path,
          line: node.line || 0,
          snippet: node.code,
          description: `${node.node_type}: ${node.name}`
        });
      }
    }
    return {
      query: question,
      type: "code",
      status: "success",
      message: `\u627E\u5230 ${searchResult.matches.length} \u4E2A\u5339\u914D\uFF0C\u83B7\u53D6 ${nodesDetail.length} \u4E2A\u8282\u70B9\u8BE6\u60C5`,
      evidence
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      query: question,
      type: "code",
      status: "error",
      message: err.message,
      evidence: []
    };
  }
}
async function executeRepoQuery(client, question, repoName) {
  try {
    const reposDetail = await client.getReposDetail([repoName]);
    if (!reposDetail || reposDetail.length === 0) {
      return {
        query: question,
        type: "repo",
        status: "error",
        message: `\u672A\u627E\u5230\u4ED3\u5E93: ${repoName}`,
        evidence: []
      };
    }
    const repo = reposDetail[0];
    return {
      query: question,
      type: "repo",
      status: "success",
      message: `\u4ED3\u5E93\u6982\u8FF0: ${repo.overview || "\u65E0"}`,
      evidence: []
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      query: question,
      type: "repo",
      status: "error",
      message: err.message,
      evidence: []
    };
  }
}
async function saveRepotalkResult(outputDir, results, proposal) {
  const repotalkPath = import_path5.default.join(outputDir, "repotalk.md");
  const content = generateRepotalkContent(proposal, results);
  import_fs5.default.writeFileSync(repotalkPath, content, "utf-8");
  return repotalkPath;
}
function generateRepotalkContent(proposal, results) {
  const lines = [];
  lines.push("# Repotalk \u53D6\u8BC1\u7ED3\u679C");
  lines.push("");
  lines.push("> \u672C\u6587\u6863\u7531 Repotalk MCP \u81EA\u52A8\u751F\u6210\uFF0C\u5305\u542B\u4EE3\u7801\u5E93\u4E2D\u7684\u76F8\u5173\u8BC1\u636E");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## \u67E5\u8BE2\u6458\u8981");
  lines.push("");
  lines.push(`- **\u67E5\u8BE2\u6570\u91CF**: ${results.length}`);
  lines.push(`- **\u6210\u529F**: ${results.filter((r) => r.status === "success").length}`);
  lines.push(`- **\u5F85\u5904\u7406**: ${results.filter((r) => r.status === "pending").length}`);
  lines.push(`- **\u5931\u8D25**: ${results.filter((r) => r.status === "error").length}`);
  lines.push("");
  lines.push("## \u67E5\u8BE2\u8BE6\u60C5");
  lines.push("");
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    lines.push(`### \u67E5\u8BE2 ${i + 1}: ${result.query}`);
    lines.push("");
    lines.push(`- **\u7C7B\u578B**: ${result.type}`);
    lines.push(`- **\u72B6\u6001**: ${result.status}`);
    lines.push("");
    if (result.message) {
      lines.push("**\u7ED3\u679C**:");
      lines.push("");
      lines.push(result.message);
      lines.push("");
    }
    if (result.evidence.length > 0) {
      lines.push("**\u8BC1\u636E**:");
      lines.push("");
      for (const evidence of result.evidence) {
        lines.push(`#### ${evidence.file}:${evidence.line}`);
        if (evidence.description) {
          lines.push(`*${evidence.description}*`);
        }
        lines.push("");
        lines.push("```");
        lines.push(evidence.snippet);
        lines.push("```");
        lines.push("");
      }
    }
  }
  const allEvidence = results.flatMap((r) => r.evidence);
  if (allEvidence.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## \u8BC1\u636E\u6C47\u603B");
    lines.push("");
    lines.push("| \u6587\u4EF6 | \u884C\u53F7 | \u63CF\u8FF0 |");
    lines.push("|------|------|------|");
    for (const evidence of allEvidence) {
      const desc = evidence.description || "-";
      lines.push(`| ${evidence.file} | ${evidence.line} | ${desc} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

// src/utils/claude/tasker.ts
var import_fs7 = __toESM(require("fs"), 1);
var import_path6 = __toESM(require("path"), 1);

// src/commands/repo-plan.ts
var program2 = new Command();
program2.name("repo-plan").description("\u57FA\u4E8E\u9700\u6C42\u751F\u6210\u6267\u884C\u8BA1\u5212").argument("<requirement>", "\u9700\u6C42\u63CF\u8FF0\uFF08\u652F\u6301\u81EA\u7136\u8BED\u8A00\uFF09").option("-d, --detail-level <level>", "\u8BE6\u7EC6\u7A0B\u5EA6: simple | standard | detailed", "standard").option("-o, --output <path>", "\u8F93\u51FA\u76EE\u5F55").option("--no-llm", "\u8DF3\u8FC7 LLM \u91CD\u7EC4").option("--no-repotalk", "\u8DF3\u8FC7 Repotalk \u53D6\u8BC1").option("--no-claude", "\u8DF3\u8FC7 Claude \u751F\u6210\u8BBE\u8BA1").action(async (requirement, options) => {
  try {
    const startTime = Date.now();
    console.log("\u{1F680} \u5F00\u59CB\u751F\u6210\u8BA1\u5212...\n");
    console.log(`\u{1F4DD} \u9700\u6C42: ${requirement}
`);
    console.log(`\u2699\uFE0F  \u914D\u7F6E: \u8BE6\u7EC6\u7A0B\u5EA6=${options.detailLevel}
`);
    const repoInfo = await locateRepo();
    if (!repoInfo) {
      console.error("\u274C \u65E0\u6CD5\u5B9A\u4F4D\u4ED3\u5E93\uFF0C\u9000\u51FA");
      process.exit(1);
    }
    const repoPath = repoInfo.path || process.cwd();
    const { planDir, planId, logFile } = await initDirectories(repoPath);
    initLogger(logFile, planId);
    log.info("main", `\u5F00\u59CB\u8BA1\u5212\u751F\u6210: ${requirement}`);
    log.info("main", `\u4ED3\u5E93\u4FE1\u606F: ${JSON.stringify(repoInfo)}`);
    if (!options.noLlm) {
      const refineResult = await refineRequirement({
        repoInfo,
        rawInput: requirement,
        outputDir: planDir,
        detailLevel: options.detailLevel
      });
      if (!refineResult.success) {
        log.error("main", "LLM \u91CD\u7EC4\u5931\u8D25", refineResult.error);
        console.error("\u274C LLM \u91CD\u7EC4\u5931\u8D25\uFF0C\u7EE7\u7EED\u4F7F\u7528\u539F\u59CB\u9700\u6C42");
      }
    } else {
      console.log("\u23ED\uFE0F  \u8DF3\u8FC7 LLM \u91CD\u7EC4\n");
      log.info("main", "\u8DF3\u8FC7 LLM \u91CD\u7EC4");
    }
    let repotalkPath = "";
    if (!options.noRepotalk) {
      const investigateResult = await investigate({
        repoInfo,
        proposalPath: `${planDir}/proposal.md`,
        outputDir: planDir,
        rawInput: requirement
      });
      if (!investigateResult.success) {
        log.error("main", "Repotalk \u53D6\u8BC1\u5931\u8D25", investigateResult.error);
        console.error("\u274C Repotalk \u53D6\u8BC1\u5931\u8D25\uFF0C\u7EE7\u7EED\u4F7F\u7528\u73B0\u6709\u4FE1\u606F");
      } else {
        repotalkPath = investigateResult.repotalkPath || "";
      }
    } else {
      console.log("\u23ED\uFE0F  \u8DF3\u8FC7 Repotalk \u53D6\u8BC1\n");
      log.info("main", "\u8DF3\u8FC7 Repotalk \u53D6\u8BC1");
    }
    if (false) {
      const designResult = await generateDesign({
        proposalPath: `${planDir}/proposal.md`,
        repotalkPath: repotalkPath || `${planDir}/repotalk.md`,
        outputDir: planDir,
        repoPath: repoInfo.path || process.cwd()
      });
      if (!designResult.success) {
        log.error("main", "Claude \u751F\u6210\u8BBE\u8BA1\u5931\u8D25", designResult.error);
        console.error("\u274C Claude \u751F\u6210\u8BBE\u8BA1\u5931\u8D25");
        process.exit(1);
      }
    } else {
      console.log("\u23ED\uFE0F  \u8DF3\u8FC7 Claude \u751F\u6210\u8BBE\u8BA1\n");
      log.info("main", "\u8DF3\u8FC7 Claude \u751F\u6210\u8BBE\u8BA1");
    }
    const duration = Date.now() - startTime;
    console.log("\u2705 \u8BA1\u5212\u751F\u6210\u5B8C\u6210!\n");
    console.log(`\u{1F4CA} \u603B\u8017\u65F6: ${(duration / 1e3).toFixed(2)}s
`);
    console.log(`\u{1F4C1} \u8F93\u51FA\u76EE\u5F55: ${planDir}
`);
    console.log("\u{1F4C4} \u751F\u6210\u7684\u6587\u4EF6:");
    console.log(`   - proposal.md   \u9700\u6C42\u6587\u6863`);
    console.log(`   - repotalk.md   \u53D6\u8BC1\u7ED3\u679C${options.noRepotalk ? " (\u8DF3\u8FC7)" : ""}`);
    console.log(`   - design.md     \u6280\u672F\u8BBE\u8BA1${options.noClaude ? " (\u8DF3\u8FC7)" : ""}`);
    console.log(`   - tasks.md      \u4EFB\u52A1\u6E05\u5355${options.noClaude ? " (\u8DF3\u8FC7)" : ""}`);
    console.log(`   - log           \u6267\u884C\u65E5\u5FD7
`);
    log.stepComplete(0, "\u8BA1\u5212\u751F\u6210\u5B8C\u6210", duration);
    log.info("main", `\u8BA1\u5212\u751F\u6210\u6210\u529F\uFF0C\u76EE\u5F55: ${planDir}`);
  } catch (error) {
    console.error("\u274C \u53D1\u751F\u9519\u8BEF:", error);
    process.exit(1);
  }
});
program2.parse();
