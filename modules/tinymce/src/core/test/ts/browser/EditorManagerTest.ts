import { after, afterEach, before, describe, it } from '@ephox/bedrock-client';
import { assert } from 'chai';

import DOMUtils from 'tinymce/core/api/dom/DOMUtils';
import Editor from 'tinymce/core/api/Editor';
import EditorManager from 'tinymce/core/api/EditorManager';
import PluginManager from 'tinymce/core/api/PluginManager';
import Delay from 'tinymce/core/api/util/Delay';
import Tools from 'tinymce/core/api/util/Tools';
import Theme from 'tinymce/themes/silver/Theme';
import * as ViewBlock from '../module/test/ViewBlock';

describe('browser.tinymce.core.EditorManagerTest', () => {
  const viewBlock = ViewBlock.bddSetup();

  before(() => Theme());
  after(() => EditorManager.remove());

  afterEach((done) => {
    Delay.setTimeout(() => {
      EditorManager.remove();
      done();
    }, 0);
  });

  it('get', (done) => {
    viewBlock.update('<textarea class="tinymce"></textarea>');
    EditorManager.init({
      selector: 'textarea.tinymce',
      skin_url: '/project/tinymce/js/tinymce/skins/ui/oxide',
      content_css: '/project/tinymce/js/tinymce/skins/content/default',
      init_instance_callback: (editor1) => {
        assert.lengthOf(EditorManager.get(), 1);
        assert.equal(EditorManager.get(0), EditorManager.activeEditor);
        assert.isNull(EditorManager.get(1));
        assert.isNull(EditorManager.get('noid'));
        assert.isNull(EditorManager.get(undefined));
        assert.equal(EditorManager.get()[0], EditorManager.activeEditor);
        assert.equal(EditorManager.get(EditorManager.activeEditor.id), EditorManager.activeEditor);
        assert.notEqual(EditorManager.get(), EditorManager.get());

        // Trigger save
        let saveCount = 0;

        editor1.on('SaveContent', () => {
          saveCount++;
        });

        EditorManager.triggerSave();
        assert.equal(saveCount, 1);

        // Re-init on same id
        EditorManager.init({
          selector: '#' + EditorManager.activeEditor.id,
          skin_url: '/project/tinymce/js/tinymce/skins/ui/oxide',
          content_css: '/project/tinymce/js/tinymce/skins/content/default'
        });

        assert.lengthOf(EditorManager.get(), 1);
        done();
      }
    });
  });

  it('addI18n/translate', () => {
    EditorManager.addI18n('en', {
      from: 'to'
    });

    assert.equal(EditorManager.translate('from'), 'to');
  });

  it('Do not reload language pack if it was already loaded or registered manually.', (done) => {
    const langCode = 'mce_lang';
    const langUrl = 'http://example.com/language/' + langCode + '.js';

    EditorManager.addI18n(langCode, {
      from: 'to'
    });

    viewBlock.update('<textarea></textarea>');

    EditorManager.init({
      selector: 'textarea',
      skin_url: '/project/tinymce/js/tinymce/skins/ui/oxide',
      content_css: '/project/tinymce/js/tinymce/skins/content/default',
      language: langCode,
      language_url: langUrl,
      init_instance_callback: (_ed) => {
        const scripts = Tools.grep(document.getElementsByTagName('script'), (script) => {
          return script.src === langUrl;
        });

        assert.equal(scripts.length, 0);

        done();
      }
    });
  });

  it('Externally destroyed editor', ( done) => {
    EditorManager.remove();

    EditorManager.init({
      selector: 'textarea',
      skin_url: '/project/tinymce/js/tinymce/skins/ui/oxide',
      content_css: '/project/tinymce/js/tinymce/skins/content/default',
      init_instance_callback: (editor1) => {
        Delay.setTimeout(() => {
          // Destroy the editor by setting innerHTML common ajax pattern
          viewBlock.update('<textarea id="' + editor1.id + '"></textarea>');

          // Re-init the editor will have the same id
          EditorManager.init({
            selector: 'textarea',
            skin_url: '/project/tinymce/js/tinymce/skins/ui/oxide',
            content_css: '/project/tinymce/js/tinymce/skins/content/default',
            init_instance_callback: (editor2) => {
              assert.lengthOf(EditorManager.get(), 1);
              assert.equal(editor1.id, editor2.id);
              assert.isTrue(editor1.destroyed, 'First editor instance should be destroyed');

              done();
            }
          });
        }, 0);
      }
    });
  });

  it('overrideDefaults', () => {
    const oldBaseURI = EditorManager.baseURI;
    const oldBaseUrl = EditorManager.baseURL;
    const oldSuffix = EditorManager.suffix;

    EditorManager.overrideDefaults({
      test: 42,
      base_url: 'http://www.EditorManager.com/base/',
      suffix: 'x',
      external_plugins: {
        plugina: '//domain/plugina.js',
        pluginb: '//domain/pluginb.js'
      },
      plugin_base_urls: {
        testplugin: 'http://custom.ephox.com/dir/testplugin'
      }
    });

    assert.strictEqual(EditorManager.baseURI.path, '/base');
    assert.strictEqual(EditorManager.baseURL, 'http://www.EditorManager.com/base');
    assert.strictEqual(EditorManager.suffix, 'x');
    assert.strictEqual(new Editor('ed1', {}, EditorManager).settings.test, 42);
    assert.strictEqual(PluginManager.urls.testplugin, 'http://custom.ephox.com/dir/testplugin');

    assert.deepEqual(new Editor('ed2', {
      base_url: '/project/tinymce/js/tinymce',
      external_plugins: {
        plugina: '//domain/plugina2.js',
        pluginc: '//domain/pluginc.js'
      },
      plugin_base_urls: {
        testplugin: 'http://custom.ephox.com/dir/testplugin'
      }
    }, EditorManager).settings.external_plugins, {
      plugina: '//domain/plugina2.js',
      pluginb: '//domain/pluginb.js',
      pluginc: '//domain/pluginc.js'
    });

    assert.deepEqual(new Editor('ed3', {
      base_url: '/project/tinymce/js/tinymce'
    }, EditorManager).settings.external_plugins, {
      plugina: '//domain/plugina.js',
      pluginb: '//domain/pluginb.js'
    });

    EditorManager.baseURI = oldBaseURI;
    EditorManager.baseURL = oldBaseUrl;
    EditorManager.suffix = oldSuffix;

    EditorManager.overrideDefaults({});
  });

  it('Init inline editor on invalid targets', () => {
    const invalidNames = (
      'area base basefont br col frame hr img input isindex link meta param embed source wbr track ' +
      'colgroup option tbody tfoot thead tr script noscript style textarea video audio iframe object menu'
    );

    EditorManager.remove();

    Tools.each(invalidNames.split(' '), (invalidName) => {
      const elm = DOMUtils.DOM.add(document.body, invalidName, { class: 'targetEditor' }, null);

      EditorManager.init({
        selector: invalidName + '.targetEditor',
        skin_url: '/project/tinymce/js/tinymce/skins/ui/oxide',
        content_css: '/project/tinymce/js/tinymce/skins/content/default',
        inline: true
      });

      assert.strictEqual(EditorManager.get().length, 0, 'Should not have created an editor');
      DOMUtils.DOM.remove(elm);
    });
  });
});
