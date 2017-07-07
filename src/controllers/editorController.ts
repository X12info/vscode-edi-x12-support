import { StatusBarItem, StatusBarAlignment, window, TextEditor, Selection, Range, ExtensionContext, languages, workspace, TextDocumentChangeEvent, TextDocument } from 'vscode';
import { Constants } from '../constants'
import { Parser } from '../parser'
import { EdiHoverProvider } from '../providers/ediHoverProvider';
import { EdiHighlightProvider } from '../providers/ediHighlightProvider';
import { EdiDocumentSymbolProvider } from '../providers/ediDocumentSymbolProvider';
import { provide } from "../container";

@provide(EditorController)
export class EditorController implements Disposable {

    private _statusBarItem: StatusBarItem;

    public bind(context: ExtensionContext) {
        context.subscriptions.push(this);
        context.subscriptions.push(languages.registerHoverProvider(Constants.languageId, new EdiHoverProvider(this)))
        context.subscriptions.push(languages.registerDocumentHighlightProvider(Constants.languageId, new EdiHighlightProvider(this)));
        context.subscriptions.push(languages.registerDocumentHighlightProvider(Constants.languageId, new EdiHighlightProvider(this)));
        context.subscriptions.push(languages.registerDocumentSymbolProvider(Constants.languageId, new EdiDocumentSymbolProvider(this)));
    }

    public constructor() {
        // Prepare messing
        this._statusBarItem = this.createStatusBar();
        this.onDidChangeActiveTextEditor(window.activeTextEditor);

        // Attach events
        window.onDidChangeActiveTextEditor((params) => this.onDidChangeActiveTextEditor(params));
        workspace.onDidChangeTextDocument((params) => this.onDidChangeTextDocument(params.document));
    }

    public setStatus(message: string, tooltip: string = "EDI Extension Status") {
        this._statusBarItem.text = message;
        this._statusBarItem.tooltip = tooltip;
    }

    private onDidChangeActiveTextEditor(textEditor: TextEditor) {
        if (textEditor == null) {
            return;
        }
        if (textEditor.document.languageId === Constants.languageId) {
            this.documentActive(textEditor);
        } else {
            this.documentInactive(textEditor);
        }

        this.onDidChangeTextDocument(textEditor.document);
    }

    private onDidChangeTextDocument(document: TextDocument) {
        if (document.languageId === Constants.languageId) {

            let parser = new Parser();
            let result = parser.parseHeader(document.getText());
            if (!result.isValid) {
                this.setStatus("No Valid ISA Header", result.errorMessage);
            } else {
                this.setStatus("Valid ISA Header", result.configuration.toString());
            }
        }
    }

    private documentActive(textEditor: TextEditor) {
        console.log(`EDI Doc - ${textEditor.document.fileName}`);
        this._statusBarItem.show();
    }

    private documentInactive(textEditor: TextEditor) {
        console.log("EDI doc Inactive");
        this._statusBarItem.hide();
    }

    private createStatusBar(): StatusBarItem {
        let statusBar = window.createStatusBarItem(StatusBarAlignment.Right, 100);
        statusBar.tooltip = 'EDI Extension Status';
        return statusBar;
    }

    public dispose() {
    }
}