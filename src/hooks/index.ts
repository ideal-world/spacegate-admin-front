export * from './useGateway';
import { Api, Model } from 'spacegate-admin-client';
import { Ref, onMounted, onUnmounted, ref, watch, computed, toRaw } from "vue";
import * as monaco from 'monaco-editor';
import { unwrapResponse } from '../utils';


export async function updateAllSchema() {
    let resp = await Api.pluginList();
    let list = unwrapResponse(resp);
    let schemas = list.map(code => ({
        uri: `http:///api/plugin/schema/${code}`,
        fileMatch: [
            `**/${code}/*.json`,
        ],
    }))
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas,
        enableSchemaRequest: true,
    })
}

export function updatePluginCodes(): Ref<string[]> {
    const options = ref<string[]>([]);
    Api.pluginList().then(unwrapResponse).then((newOptions) => options.value = newOptions);
    return options
}

export function useMonacoJsonEditor(target: Ref<HTMLElement | null>, initValue?: unknown, options = <
    { schema?: string }
    >{}) {


    const randomId = Math.random().toString(36).substring(7);
    const genUriBySchema = (schema?: string) => {
        if (schema === undefined) {
            return `/_json/${randomId}.json`;
        } else {
            return `/_json/${schema}/${randomId}.json`;
        }
    }
    let editor: monaco.editor.ICodeEditor | null = null;
    let opts: { schema?: string };
    if (options === undefined) {
        opts = {}
    } else {
        opts = options
    }
    let {
        schema
    } = opts;
    const jsonValue = ref(initValue);
    const schemaRef = ref<string | undefined>(schema);
    const getValue = () => {
        if (!editor) {
            return undefined
        }
        const newValue = editor.getValue()
        const newJsonValue = JSON.parse(newValue)
        jsonValue.value = newJsonValue
        return newJsonValue
    }

    const setValue = (value: unknown) => {
        if (editor) {
            if (value === undefined) {
                editor.setValue('')
                return
            }
            const newValue = JSON.stringify(value, null, 2)
            if (editor.getValue() !== newValue) {
                editor.setValue(newValue)
            }
        }
    }

    const setSchema = (schema?: string) => {
        if (!target.value) return
        if (editor === null) {
            editor = monaco.editor.create(target.value, {
                minimap: {
                    enabled: false,
                },
                automaticLayout: true,
            })
        }
        let uri = monaco.Uri.parse(genUriBySchema(schema));
        let model = monaco.editor.getModel(uri);
        const isModelEmpty = model === null || model === undefined;
        schemaRef.value = schema
        if (isModelEmpty) {
            model = monaco.editor.createModel(JSON.stringify(initValue, null, 2), "json", uri)
        }
        editor.setModel(model)
    }

    onMounted(async () => {
        if (!target.value) return
        if (schemaRef.value !== undefined) {
            await updateAllSchema()
        }
        setSchema(schemaRef.value)
    })

    onUnmounted(() => {

    })


    return { getValue, setValue, setSchema };
}