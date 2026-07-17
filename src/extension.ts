import * as vscode from "vscode";

// Type definitions for the Python extension's public API
interface IEnvironmentPath {
  id: string;
  path: string;
}

interface IInterpreterSettingObject {
  name: string;
  path: string;
}

type IInterpreterSetting = string | IInterpreterSettingObject;

interface IInterpreterOption {
  label: string;
  description?: string;
  path: string;
}

interface IPythonEnvironmentApi {
  environments: {
    updateActiveEnvironmentPath(
      path: string,
      resource?: vscode.Uri,
    ): Promise<void>;
    getActiveEnvironmentPath(resource?: vscode.Uri): IEnvironmentPath;
  };
}

/**
 * Activates the ms-python.python extension and returns its API.
 */
async function getPythonApi(): Promise<IPythonEnvironmentApi | undefined> {
  const extension = vscode.extensions.getExtension("ms-python.python");
  if (!extension) {
    vscode.window.showErrorMessage(
      "The Microsoft Python extension is not installed.",
    );
    return undefined;
  }
  if (!extension.isActive) {
    await extension.activate();
  }
  return extension.exports as IPythonEnvironmentApi;
}

function toInterpreterOption(
  interpreter: IInterpreterSetting,
): IInterpreterOption {
  if (typeof interpreter === "string") {
    return {
      label: interpreter,
      path: interpreter,
    };
  }

  return {
    label: interpreter.name,
    description: interpreter.path,
    path: interpreter.path,
  };
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "pyswap.select",
    async () => {
      const config = vscode.workspace.getConfiguration("pyswap");
      const interpreters = config.get<IInterpreterSetting[]>(
        "interpreterPaths",
        [],
      );

      const interpreterOptions = interpreters.map(toInterpreterOption);

      if (interpreterOptions.length === 0) {
        vscode.window.showWarningMessage(
          "No interpreter paths configured. " +
            'Add paths to "pyswap.interpreterPaths" in your settings.json.',
        );
        return;
      }

      const selected = await vscode.window.showQuickPick(interpreterOptions, {
        matchOnDescription: true,
        placeHolder: "Select a Python interpreter",
      });

      if (!selected) {
        return;
      }

      // Use the Python extension's API to set the interpreter silently
      const pythonApi = await getPythonApi();
      if (!pythonApi) {
        return;
      }

      try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri;
        await pythonApi.environments.updateActiveEnvironmentPath(
          selected.path,
          workspaceFolder,
        );
        vscode.window.showInformationMessage(
          selected.description
            ? `Python interpreter set to: ${selected.label} (${selected.description})`
            : `Python interpreter set to: ${selected.label}`,
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(
          `Failed to set interpreter: ${err.message}`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
