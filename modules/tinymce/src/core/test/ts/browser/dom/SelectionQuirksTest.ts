import { Assertions, GeneralSteps, Keyboard, Keys, Logger, Pipeline, Step } from '@ephox/agar';
import { UnitTest } from '@ephox/bedrock-client';
import { TinyActions, TinyApis, TinyLoader } from '@ephox/mcagar';
import { SugarElement } from '@ephox/sugar';
import Theme from 'tinymce/themes/silver/Theme';

UnitTest.asynctest('browser.tinymce.core.dom.SelectionQuirksTest', (success, failure) => {

  Theme();

  TinyLoader.setupLight((editor, onSuccess, onFailure) => {
    const tinyApis = TinyApis(editor);
    const tinyActions = TinyActions(editor);
    let count;

    // hijack editor.selection.normalize() to count how many times it will be invoked
    const backupNormalize = editor.selection.normalize;
    const normalize = (...args: any[]) => {
      count = count === undefined ? 1 : count + 1;
      backupNormalize.apply(this, args);
    };
    editor.selection.normalize = normalize;

    const sResetNormalizeCounter = () => {
      return Step.sync(() => {
        count = 0;
      });
    };

    const sAssertNormalizeCounter = (expected) => {
      return Step.sync(() => {
        Assertions.assertEq('checking normalization counter', expected, count);
      });
    };

    const sClickBody = (editor) => {
      return Step.sync(() => {
        const target = editor.getBody();

        editor.fire('mousedown', { target });
        editor.fire('mouseup', { target });
        editor.fire('click', { target });
      });
    };

    Pipeline.async({}, [
      tinyApis.sFocus(),

      Logger.t('Test normalization for floated images', GeneralSteps.sequence([
        tinyApis.sSetContent('<p>a<img src="about:blank" style="float: right"></p>'),
        tinyApis.sSetSelection([ 0 ], 1, [ 0 ], 2),
        Step.sync(() => {
          const selection = editor.selection.getSel();
          Assertions.assertEq('Anchor node should be the paragraph not the text node', 'P', selection.anchorNode.nodeName);
          Assertions.assertEq('Anchor offset should be the element index', 1, selection.anchorOffset);
        })
      ])),

      Logger.t('Normalize on key events when range is collapsed', GeneralSteps.sequence([
        tinyApis.sSetContent('<p>a</p><p>b</p>'),
        tinyApis.sSetSelection([], 1, [], 1),
        tinyActions.sContentKeystroke(Keys.escape(), {}),
        tinyApis.sAssertSelection([ 1, 0 ], 0, [ 1, 0 ], 0)
      ])),

      Logger.t('Normalize on mouse events when range is expanded', GeneralSteps.sequence([
        tinyApis.sSetContent('<p>a</p><p>b</p>'),
        tinyApis.sSetSelection([], 0, [], 1),
        sClickBody(editor),
        tinyApis.sAssertSelection([ 0, 0 ], 0, [ 0, 0 ], 1)
      ])),

      Logger.t('Normalize on mouse events when range is collapsed', GeneralSteps.sequence([
        tinyApis.sSetContent('<p>a</p><p>b</p>'),
        tinyApis.sSetSelection([], 1, [], 1),
        sClickBody(editor),
        tinyApis.sAssertSelection([ 1, 0 ], 0, [ 1, 0 ], 0)
      ])),

      Logger.t('Normalization during operations with modifier keys, should run only once in the end when user releases modifier key.', GeneralSteps.sequence([
        sResetNormalizeCounter(),
        tinyApis.sSetContent('<p><b>a</b><i>a</i></p>'),
        tinyApis.sSetSelection([ 0, 0, 0 ], 0, [ 0, 0 ], 0),
        Keyboard.sKeyup(SugarElement.fromDom(editor.getDoc()), Keys.left(), { shift: true }),
        sAssertNormalizeCounter(0),
        Keyboard.sKeyup(SugarElement.fromDom(editor.getDoc()), 17, {}), // single ctrl
        sAssertNormalizeCounter(1),
        tinyApis.sAssertSelection([ 0, 0 ], 0, [ 0, 0 ], 0)
      ]))
    ], onSuccess, onFailure);
  }, {
    base_url: '/project/tinymce/js/tinymce'
  }, success, failure);
});
