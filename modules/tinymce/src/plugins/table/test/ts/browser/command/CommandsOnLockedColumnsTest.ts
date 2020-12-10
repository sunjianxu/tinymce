import { ApproxStructure, Assertions, Log, Pipeline, Step } from '@ephox/agar';
import { UnitTest } from '@ephox/bedrock-client';
import { Arr } from '@ephox/katamari';
import { TinyApis, TinyLoader } from '@ephox/mcagar';
import { SugarElement, SugarNode } from '@ephox/sugar';
import Editor from 'tinymce/core/api/Editor';
import { EditorEvent } from 'tinymce/core/api/util/EventDispatcher';
import Plugin from 'tinymce/plugins/table/Plugin';
import SilverTheme from 'tinymce/themes/silver/Theme';
import * as TableTestUtils from '../../module/test/TableTestUtils';

UnitTest.asynctest('browser.tinymce.plugins.table.command.CommandsOnLockedColumnsTest', (success, failure) => {
  Plugin();
  SilverTheme();

  let events = [];
  const logEvent = (event: EditorEvent<{}>) => {
    events.push(event);
  };

  const sClearEvents = Step.sync(() => events = []);

  const defaultEvents = [ 'tablemodified' ];
  const sAssertEvents = (expectedEvents: string[] = defaultEvents) => Step.sync(() => {
    if (events.length > 0) {
      Arr.each(events, (event) => {
        const tableElm = SugarElement.fromDom(event.table);
        Assertions.assertEq('Cell style commands do not modify table structure', event.structure, false);
        Assertions.assertEq('Cell style commands modify table style', event.style, true);
        Assertions.assertEq('Expected events should have been fired', true, SugarNode.isTag('table')(tableElm));
        Assertions.assertEq('Should not have structure modified', false, events[0].structure);
        Assertions.assertEq('Should have style modified', true, events[0].style);
      });
    }
    Assertions.assertEq('Expected events should have been fired', expectedEvents, Arr.map(events, (event) => event.type));
  });

  TinyLoader.setup((editor: Editor, onSuccess, onFailure) => {
    const tinyApis = TinyApis(editor);

    const table = '<table style="border-collapse: collapse; width: 100%;" border="1" data-snooker-locked-cols="0">' +
      '<tbody>' +
      '<tr>' +
      `<td style="width: 50%;">a</td>` +
      `<td style="width: 50%;">b</td>` +
      '</tr>' +
      '<tr>' +
      `<td style="width: 50%;">c</td>` +
      `<td style="width: 50%;">d</td>` +
      '</tr>' +
      '</tbody>' +
      '</table>';

    const tableStructure = ApproxStructure.fromHtml(table);

    const sTestColumnCommand = (cmdInfo: { cmd: string; value?: any }) =>
      Log.stepsAsStep('TINY-6765', `Applying ${cmdInfo.cmd} command on locked column should not change the table`, [
        sAssertEvents([]),
        tinyApis.sSetContent(table),
        tinyApis.sSetCursor([ 0, 0, 0, 0 ], 0),
        tinyApis.sExecCommand(cmdInfo.cmd, cmdInfo.value),
        TableTestUtils.sAssertTableStructure(editor, tableStructure),
        sAssertEvents([])
      ]);

    const tests = Arr.map([
      { cmd: 'mceTableSplitCells' },
      { cmd: 'mceTableMergeCells' },
      { cmd: 'mceTableInsertColBefore' },
      { cmd: 'mceTableInsertColAfter' },
      { cmd: 'mceTableDeleteCol' },
      { cmd: 'mceTableCutCol' },
      { cmd: 'mceTableCopyCol' },
      { cmd: 'mceTablePasteColBefore' },
      { cmd: 'mceTablePasteColAfter' },
      // {
      //   cmd: 'mceTableCellType',
      //   value: { type: 'th' }
      // },
      {
        cmd: 'mceTableColType',
        value: { type: 'th' }
      },
      // { cmd: 'mceTableCellProps' }
    ], sTestColumnCommand);

    Pipeline.async({}, [
      tinyApis.sFocus(),
      ...tests,
      sClearEvents
    ], onSuccess, onFailure);
  }, {
    plugins: 'table',
    theme: 'silver',
    base_url: '/project/tinymce/js/tinymce',
    setup: (editor: Editor) => {
      editor.on('tablemodified', logEvent);
    }
  }, success, failure);
});

