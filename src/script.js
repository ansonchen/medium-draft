import React from 'react';
import ReactDOM from 'react-dom';
import { EditorState, convertToRaw, convertFromRaw, CompositeDecorator } from 'draft-js';

import { Editor, StringToTypeMap, Block, Link, findLinkEntities } from './index';


const newTypeMap = StringToTypeMap;
newTypeMap['2.'] = Block.OL

class App extends React.Component {
  constructor(props) {
    super(props);

    const decorator = new CompositeDecorator([
      {
        strategy: findLinkEntities,
        component: Link,
      },
    ]);

    this.state = {
      editorState: EditorState.createEmpty(decorator),
      editorEnabled: true,
      placeholder: 'Write your story...'
    };

    this.onChange = (editorState, callback = null) => {
      if (this.state.editorEnabled) {
        this.setState({ editorState }, () => {
          if (callback) {
            callback();
          }
        });
      }
    };

    this.logData = this.logData.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.loadSavedData = this.loadSavedData.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.handleDroppedFiles = this.handleDroppedFiles.bind(this);
  }

  componentDidMount() {
    this.setState({
      placeholder: 'Loading content...',
    });
    setTimeout(this.fetchData, 1000);
  }

  fetchData() {
    window.ga('send', 'event', 'draftjs', 'load-data', 'ajax');
    const req = new XMLHttpRequest();
    req.open('GET', '/data.json', true);
    req.onreadystatechange = () => {
      if (req.readyState === 4) {
        const data = JSON.parse(req.responseText);
        this.setState({
          editorState: EditorState.push(this.state.editorState, convertFromRaw(data)),
          placeholder: 'Write your story...'
        }, () => {
          this.refs.editor.focus();
        });
        window.ga('send', 'event', 'draftjs', 'data-success');
      }
    };
    req.send();
  }

  logData(e) {
    console.log(convertToRaw(this.state.editorState.getCurrentContent()));
    console.log(this.state.editorState.getSelection().toJS());
    window.ga('send', 'event', 'draftjs', 'log-data');
  }

  handleKeyCommand(command) {
    if (command === 'editor-save') {
      window.localStorage['editor'] = JSON.stringify(convertToRaw(this.state.editorState.getCurrentContent()));
      window.ga('send', 'event', 'draftjs', command);
      return true;
    } else if (command === 'load-saved-data') {
      this.loadSavedData();
      return true;
    }
    return false;
  }

  loadSavedData() {
    const data = window.localStorage.getItem('editor');
    if (data === null) {
      return;
    }
    try {
      const blockData = JSON.parse(data);
      console.log(blockData);
      this.onChange( EditorState.push(this.state.editorState, convertFromRaw(blockData)), this.refs.editor.focus);
    } catch(e) {
      console.log(e);
    }
    window.ga('send', 'event', 'draftjs', 'load-data', 'localstorage');
  }

  toggleEdit(e) {
    this.setState({
      editorEnabled: !this.state.editorEnabled
    }, () => {
      window.ga('send', 'event', 'draftjs', 'toggle-edit', this.state.editorEnabled + '');
    });
  }

  handleDroppedFiles(selection, files) {
    console.log(files);
    console.log(selection);
    window.ga('send', 'event', 'draftjs', 'filesdropped', files.length + ' files');
  }

  render() {
    const { editorState, editorEnabled } = this.state;
    return (
      <div>
        <Editor
          ref="editor"
          editorState={editorState}
          onChange={this.onChange}
          editorEnabled={editorEnabled}
          handleDroppedFiles={this.handleDroppedFiles}
          handleKeyCommand={this.handleKeyCommand}
          placeholder={this.state.placeholder}
        />
        <div className="editor-action">
          <button onClick={this.logData}>Log State</button>
          <button onClick={this.toggleEdit}>Toggle Edit</button>
        </div>
      </div>
    );
  }
};

ReactDOM.render(
  <App />,
  document.getElementById('app')
);
// window.ga = function() {
//   console.log(arguments);
// };