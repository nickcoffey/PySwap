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

function getWorkspaceResource(): vscode.Uri | undefined {
  return (
    vscode.window.activeTextEditor?.document.uri ??
    vscode.workspace.workspaceFolders?.[0]?.uri
  );
}

function getInterpreterDisplayName(
  activePath: string,
  interpreters: IInterpreterOption[],
): string {
  const match = interpreters.find(
    (interpreter) => interpreter.path === activePath,
  );

  if (!match) {
    return activePath;
  }

  return match.label;
}

export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "pyswap.select";
  context.subscriptions.push(statusBarItem);

  const refreshStatusBar = async () => {
    const config = vscode.workspace.getConfiguration("pyswap");
    const interpreters = config
      .get<IInterpreterSetting[]>("interpreterPaths", [])
      .map(toInterpreterOption);

    if (interpreters.length === 0) {
      statusBarItem.text = "$(python) PySwap";
      statusBarItem.tooltip =
        "No interpreter paths configured for PySwap. Open the command to pick one.";
      statusBarItem.show();
      return;
    }

    const pythonApi = await getPythonApi();
    if (!pythonApi) {
      statusBarItem.text = "$(python) PySwap";
      statusBarItem.tooltip =
        "The Microsoft Python extension is not installed.";
      statusBarItem.show();
      return;
    }

    const activeEnvironment = pythonApi.environments.getActiveEnvironmentPath(
      getWorkspaceResource(),
    );
    const activeInterpreterLabel = getInterpreterDisplayName(
      activeEnvironment.path,
      interpreters,
    );
    const activeInterpreterPath =
      interpreters.find(
        (interpreter) => interpreter.path === activeEnvironment.path,
      )?.path ?? activeEnvironment.path;

    statusBarItem.text = `$(python) ${activeInterpreterLabel}`;
    statusBarItem.tooltip = `Active Python interpreter: ${activeInterpreterLabel}\n${activeInterpreterPath}`;
    statusBarItem.show();
  };

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
        const workspaceFolder = getWorkspaceResource();
        await pythonApi.environments.updateActiveEnvironmentPath(
          selected.path,
          workspaceFolder,
        );
        vscode.window.showInformationMessage(
          selected.description
            ? `Python interpreter set to: ${selected.label} (${selected.description})`
            : `Python interpreter set to: ${selected.label}`,
        );
        await refreshStatusBar();
      } catch (err: any) {
        vscode.window.showErrorMessage(
          `Failed to set interpreter: ${err.message}`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("pyswap.interpreterPaths")) {
        void refreshStatusBar();
      }
    }),
    vscode.window.onDidChangeActiveTextEditor(() => {
      void refreshStatusBar();
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      void refreshStatusBar();
    }),
  );

  void refreshStatusBar();
}

export function deactivate() {}
