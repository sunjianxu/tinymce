import { Chain } from '@ephox/agar';
import { Global, Id, Strings, Type } from '@ephox/katamari';
import { Attribute, Insert, Remove, Selectors, SugarBody, SugarElement, SugarShadowDom } from '@ephox/sugar';
import Promise from '@ephox/wrap-promise-polyfill';
import 'tinymce';
import { Editor as EditorType } from '../alien/EditorTypes';
import { setTinymceBaseUrl } from '../loader/Urls';

const pFromElement = <T extends EditorType = EditorType>(element: SugarElement, settings: Record<string, any>): Promise<T> => {
  return new Promise((resolve, reject) => {
    const nuSettings: Record<string, any> = {
      toolbar_mode: 'wrap',
      ...settings
    };

    const randomId = Id.generate('tiny-loader');

    Attribute.set(element, 'id', randomId);
    if (!SugarBody.inBody(element)) {
      Insert.append(SugarBody.body(), element);
    }

    const tinymce = Global.tinymce;

    if (nuSettings.base_url) {
      setTinymceBaseUrl(tinymce, nuSettings.base_url);
    } else if (!Type.isString(tinymce.baseURL) || !Strings.contains(tinymce.baseURL, '/project/')) {
      setTinymceBaseUrl(Global.tinymce, '/project/node_modules/tinymce');
    }

    const targetSettings = SugarShadowDom.isInShadowRoot(element) ? ({ target: element.dom }) : ({ selector: '#' + randomId });

    tinymce.init({
      ...nuSettings,
      ...targetSettings,
      setup: (editor: T) => {
        if (Type.isFunction(nuSettings.setup)) {
          nuSettings.setup(editor);
        }
        editor.once('SkinLoaded', () => {
          setTimeout(() => {
            resolve(editor);
          }, 0);
        });

        editor.once('SkinLoadError', (e) => {
          reject(e.message);
        });
      }
    });
  });
};

const pFromHtml = <T extends EditorType = EditorType>(html: string | null, settings: Record<string, any>): Promise<T> => {
  const element = html ? SugarElement.fromHtml(html) : SugarElement.fromTag(settings.inline ? 'div' : 'textarea');
  return pFromElement(element, settings);
};

const pFromSettings = <T extends EditorType = EditorType>(settings: Record<string, any>): Promise<T> => {
  return pFromHtml<T>(null, settings);
};

const cFromElement = <T extends EditorType = EditorType>(element: SugarElement, settings: Record<string, any>): Chain<unknown, T> => {
  return Chain.fromPromise(() => pFromElement(element, settings));
};

const cFromHtml = <T extends EditorType = EditorType>(html: string | null, settings: Record<string, any>): Chain<any, T> => {
  return Chain.fromPromise(() => pFromHtml(html, settings));
};

const cFromSettings = <T extends EditorType = EditorType>(settings: Record<string, any>): Chain<any, T> => {
  return cFromHtml(null, settings);
};

const remove = (editor: EditorType): void => {
  const id = editor.id;
  editor.remove();
  Selectors.one('#' + id).each(Remove.remove);
};

const cRemove = Chain.op(remove);

const cCreate = cFromSettings({});
const cCreateInline = cFromSettings({ inline: true });

const pCreate = <T extends EditorType = EditorType> (): Promise<T> => pFromSettings({});
const pCreateInline = <T extends EditorType = EditorType> (): Promise<T> => pFromSettings({ inline: true });

export {
  cFromHtml,
  cFromElement,
  cFromSettings,
  cCreate,
  cCreateInline,
  cRemove,
  pFromElement,
  pFromHtml,
  pFromSettings,
  pCreate,
  pCreateInline,
  remove
};
