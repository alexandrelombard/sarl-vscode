'use strict';

import * as path from 'path';
import * as os from 'os';

import {Trace} from 'vscode-jsonrpc';
import { commands, window, workspace, ExtensionContext, Uri } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
     // The server is a locally installed in src/sarl
     let launcher = os.platform() === 'win32' ? 'sarl-standalone.bat' : 'sarl-standalone';
     let script = context.asAbsolutePath(path.join('src', 'sarl', 'bin', launcher));
     let jarFile = context.asAbsolutePath(path.join('src', 'sarl', 'bin', "sarl-language-server.jar"));
     let runJarCommand = "java -jar " + jarFile;
 
     let serverOptions: ServerOptions = {
         run : { command: runJarCommand },
         debug: { command: runJarCommand, args: [], options: { env: createDebugEnv() } }
     };
     
     let clientOptions: LanguageClientOptions = {
         documentSelector: [
             {
                 pattern: "**/*.sarl"
             }
        ],
         synchronize: {
             fileEvents: workspace.createFileSystemWatcher('**/*.*')
         }
     };
     
     // Create the language client and start the client.
     let lc = new LanguageClient('SARL Server', serverOptions, clientOptions);
     
     // enable tracing (.Off, .Messages, Verbose)
     lc.trace = Trace.Verbose;
     let disposable = lc.start();

     // Getting maven instance
     const mvn = require('maven').create({
        cwd: workspace
     });

     // Register commands
     commands.registerCommand('extension.mavenCompile', () => {
        window.showInformationMessage('Starting mvn compile...');
        mvn.execute(['compile']).then(() => {
            window.showInformationMessage('mvn compile completed successfully');
        });
     });
     
     // Push the disposable to the context's subscriptions so that the 
     // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);
}

function createDebugEnv() {
    return Object.assign({
        JAVA_OPTS:"-Xdebug -Xrunjdwp:server=y,transport=dt_socket,address=8000,suspend=n,quiet=y"
    }, process.env)
}