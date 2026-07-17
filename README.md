# PySwap

PySwap is a small VS Code extension for switching between Python interpreters from a curated list. It keeps the workflow simple: configure the interpreters you want to use, pick one from the Command Palette, and PySwap updates the active Python environment for the current workspace.

It also shows the current active interpreter in the status bar so you can see what is selected at a glance.

## Features

- Pick from a predefined list of Python interpreters with a quick picker.
- Store interpreter entries as plain paths or as named objects with a display name.
- Show the active interpreter in the status bar.
- Display the configured name when available, otherwise fall back to the interpreter path.
- Click the status bar item to open the interpreter picker again.

## Requirements

PySwap depends on the Microsoft Python extension.

- Install: `ms-python.python`
- VS Code version: `^1.125.0` or newer

PySwap is designed for workspaces where you already know which interpreters you want to use. It does not discover environments automatically.

## Getting Started

1. Install the Microsoft Python extension.
2. Install PySwap.
3. Add one or more interpreter entries to your settings.
4. Open the Command Palette and run `PySwap: Select Python Interpreter from List`.

The status bar item updates automatically when the active interpreter changes.

## Extension Settings

PySwap contributes the following setting:

- `pyswap.interpreterPaths`: List of interpreter entries to show in the picker.

This setting accepts either plain strings or objects with a friendly name and path.

### Example: plain paths

```json
{
  "pyswap.interpreterPaths": [
    "/Users/nick/.pyenv/versions/3.12.4/bin/python",
    "/Users/nick/.venv/project-a/bin/python"
  ]
}
```

### Example: named entries

```json
{
  "pyswap.interpreterPaths": [
    {
      "name": "Project A",
      "path": "/Users/nick/.venv/project-a/bin/python"
    },
    {
      "name": "Python 3.12",
      "path": "/Users/nick/.pyenv/versions/3.12.4/bin/python"
    }
  ]
}
```

## How the Status Bar Works

PySwap reads the active interpreter from the Microsoft Python extension and compares it against your configured list.

- If the active path matches a named entry, the status bar shows the name.
- If the active path matches a plain string entry, the status bar shows the path.
- If the active path is not in your list, PySwap shows the raw path.

## Command

- `PySwap: Select Python Interpreter from List`

This command opens a picker containing your configured entries and applies the selected interpreter to the current workspace.

## Known Issues

- PySwap only works with interpreters you add to `pyswap.interpreterPaths`.
- If the Microsoft Python extension is missing, PySwap cannot read or update the active interpreter.

## Release Notes

### 0.0.1

- Initial release with interpreter selection, named entries, and a status bar indicator.

## Contributing

If you want to extend PySwap, the main entry points are:

- [src/extension.ts](src/extension.ts)
- [package.json](package.json)

The extension is intentionally small, so changes to the picker, configuration schema, and status bar behavior are all in one place.

## License

This project does not currently include a license file. Add one before publishing if you plan to distribute the extension publicly.