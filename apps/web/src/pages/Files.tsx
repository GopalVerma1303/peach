import Codicon from '../components/Codicon';

/** Shown when /files is visited with no file selected - prompts user to select from sub-sidebar */
export default function Files() {
  return (
    <div className="files-empty-state">
      <Codicon name="files" size={48} />
      <p>Select a file from the list or upload a new one</p>
    </div>
  );
}
