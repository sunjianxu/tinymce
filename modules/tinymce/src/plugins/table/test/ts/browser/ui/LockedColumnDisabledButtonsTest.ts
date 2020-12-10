// import { Assertions, Chain, FocusTools, GeneralSteps, Keyboard, Keys, Mouse, NamedChain, Pipeline, Step, UiFinder, Waiter } from '@ephox/agar';
import { GeneralSteps, Log, Pipeline } from '@ephox/agar';
import { UnitTest } from '@ephox/bedrock-client';
import { Arr } from '@ephox/katamari';
import { TinyApis, TinyLoader, TinyUi } from '@ephox/mcagar';
// import { Html, Remove, Replication, SelectorFilter, SugarBody, SugarElement } from '@ephox/sugar';

import Plugin from 'tinymce/plugins/table/Plugin';
import Theme from 'tinymce/themes/silver/Theme';

interface ButtonDetails {
  name: string;
  label: string;
}

UnitTest.asynctest('browser.tinymce.plugins.table.ContextToolbarTest', (success, failure) => {
  Theme();
  Plugin();

  const columnToolbarButtons: ButtonDetails[] = [
    { name: 'tableinsertcolbefore', label: 'Insert column before' },
    { name: 'tableinsertcolafter', label: 'Insert column after' },
    { name: 'tabledeletecol', label: 'Delete column' },
    { name: 'tablecopycol', label: 'Delete column' },
    { name: 'tablecutcol', label: 'Cut column' },
    { name: 'tablepastecolbefore', label: 'Paste column before' },
    { name: 'tablepastecolafter', label: 'Paste column after' },
  ];

  const rowToolbarButtons: ButtonDetails[] = [
    { name: 'tableinsertrowbefore', label: 'Insert row before' },
    { name: 'tableinsertrowafter', label: 'Insert row after' },
    { name: 'tabledeleterow', label: 'Delete row' },
    { name: 'tablecopyrow', label: 'Delete row' },
    { name: 'tablecutrow', label: 'Cut row' },
    { name: 'tablepasterowbefore', label: 'Paste row before' },
    { name: 'tablepasterowafter', label: 'Paste row after' },
  ];
  const cellToolbarButtons: ButtonDetails[] = [
    { name: 'tablecellprops', label: 'Cell properties' },
    { name: 'tablemergecells', label: 'Merge cells' },
    { name: 'tablesplitcells', label: 'Split cells' },
  ];
  // const tableToolbarButtons =

  const toolbar = Arr.map([ ...columnToolbarButtons, ...rowToolbarButtons, ...cellToolbarButtons ], (buttonDetails) => buttonDetails.name).join(' ');

  TinyLoader.setup((editor, onSuccess, onFailure) => {
    const tinyApis = TinyApis(editor);
    const tinyUi = TinyUi(editor);

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

    const sAssertToolbarButtonState = (selector: string, disabled: boolean) => tinyUi.sWaitForUi(`${selector} toolbar button should be ${disabled ? 'disabled' : 'enabled'}`, `button[aria-label="${selector}"][aria-disabled="${disabled}"]`);

    const sPopulateTableClipboard = GeneralSteps.sequence([
      tinyApis.sSetContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>'),
      tinyApis.sSetCursor([ 0, 0, 0, 0 ], 0),
      tinyApis.sExecCommand('mceTableCopyCol'),
      tinyApis.sExecCommand('mceTableCopyRow'),
      tinyApis.sSetContent('')
    ]);

    Pipeline.async({}, [
      tinyApis.sFocus(),
      // sPopulateTableClipboard,
      Log.stepsAsStep('TINY-6765', 'Column toolbar buttons should be disabled when locked column is selected', [
        sPopulateTableClipboard,
        tinyApis.sSetContent(table),
        tinyApis.sSetCursor([ 0, 0, 0, 0 ], 0),
        ...Arr.map(columnToolbarButtons, (colToolbarButton) => sAssertToolbarButtonState(colToolbarButton.label, true))
      ]),
      Log.stepsAsStep('TINY-6765', 'Column toolbar buttons should not be disabled when locked column is not selected', [
        sPopulateTableClipboard,
        tinyApis.sSetContent(table),
        tinyApis.sSetCursor([ 0, 0, 0, 1 ], 0),
        ...Arr.map(columnToolbarButtons, (colToolbarButton) => sAssertToolbarButtonState(colToolbarButton.label, false))
      ]),
      Log.stepsAsStep('TINY-6765', 'Row toolbar buttons should not be disabled when locked column is in the table', [
        tinyApis.sSetContent(table),
        tinyApis.sSetCursor([ 0, 0, 0, 1 ], 0),
        ...Arr.map(rowToolbarButtons, (rowToolbarButton) => sAssertToolbarButtonState(rowToolbarButton.label, false))
      ])
    ], onSuccess, onFailure);
  }, {
    plugins: 'table',
    toolbar,
    base_url: '/project/tinymce/js/tinymce'
  }, success, failure);
});

// TODO: Need to test toolbar buttons as well as menu buttons
