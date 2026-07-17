import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "pyswap.select",
    async () => {
      // Read the list of interpreter paths from settings
      const config = vscode.workspace.getConfiguration("pyswap");
      const interpreters: string[] = config.get<string[]>(
        "interpreterPaths",
        [],
      );

      if (interpreters.length === 0) {
        vscode.window.showWarningMessage(
          "No interpreter paths configured. " +
            'Add paths to "pyswap.interpreterPaths" in your settings.json.',
        );
        return;
      }

      // Show a Quick Pick with available interpreters
      const selected = await vscode.window.showQuickPick(interpreters, {
        placeHolder: "Select a Python interpreter",
      });

      if (!selected) {
        return; // User cancelled
      }

      // Update the python.defaultInterpreterPath setting (globally or workspace)
      const pythonConfig = vscode.workspace.getConfiguration("python");
      await pythonConfig.update(
        "defaultInterpreterPath",
        selected,
        vscode.ConfigurationTarget.Global,
      );

      // Tell the Python extension to use the new interpreter
      await vscode.commands.executeCommand("python.setInterpreter", selected);

      vscode.window.showInformationMessage(
        `Python interpreter set to: ${selected}`,
      );
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
