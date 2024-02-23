export * from './useGateway';

import { Ref, onMounted, onUnmounted, ref, watch, computed, toRaw } from "vue";
import * as monaco from 'monaco-editor';
export function useMonacoJsonEditor(target: Ref<HTMLElement | null>, initValue: unknown = {}, options = {}) {
    let editor: monaco.ICodeEditor | null = null;
    const jsonValue = ref(initValue);
    const innerVersion = ref(0);
    const getValue = () => {
        if (!editor) {
            return undefined
        }
        const newValue = editor.getValue()
        const newJsonValue = JSON.parse(newValue)
        console.debug('newJsonValue', newJsonValue)
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
    onMounted(() => {
        if (!target.value) return
        editor = monaco.editor.create(target.value, {
            language: 'json',
            value: JSON.stringify(initValue, null, 2),
            minimap: {
                enabled: false,
            },
            automaticLayout: true,
        })
        editor.onDidChangeModelContent((e) => {
            innerVersion.value = e.versionId
        })
    })

    onUnmounted(() => {
    })


    return { getValue, setValue, innerVersion };
}