import { Cursors, UiFinder } from '@ephox/agar';
import { Editor } from '../alien/EditorTypes';
import { createDomSelection } from '../selection/SelectionTools';
import { TinyDom } from './TinyDom';

const setSelection = (editor: Editor, startPath: number[], soffset: number, finishPath: number[], foffset: number): void => {
  const rng = createDomSelection(TinyDom.body(editor), startPath, soffset, finishPath, foffset);
  editor.selection.setRng(rng);
  editor.nodeChanged();
};

const setSelectionFrom = (editor: Editor, spec: Cursors.CursorSpec | Cursors.RangeSpec): void => {
  const path = Cursors.pathFrom(spec);
  setSelection(editor, path.startPath, path.soffset, path.finishPath, path.foffset);
};

const setCursor = (editor: Editor, elementPath: number[], offset: number): void => {
  setSelection(editor, elementPath, offset, elementPath, offset);
};

const select = (editor: Editor, selector: string, path: number[]): void => {
  const container = UiFinder.findIn(TinyDom.body(editor), selector).getOrDie();
  const target = Cursors.calculateOne(container, path);
  editor.selection.select(target.dom);
};

export {
  select,
  setCursor,
  setSelection,
  setSelectionFrom
};
