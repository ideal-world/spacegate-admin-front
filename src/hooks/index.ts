export * from './useGateway';

import { Ref, onMounted, onUnmounted, ref, watch } from "vue";
import * as monaco from 'monaco-editor';
export function useMonacoJsonEditor<T>(target: Ref<HTMLElement | null>, model: T) {
    const editorInstance: Ref<monaco.editor.IStandaloneCodeEditor | null> = ref(null)
    const value = ref(model)
    onMounted(() => {
        if (!target.value) return

        const editor = monaco.editor.create(target.value, {
            language: 'json',
            value: JSON.stringify(model, null, 2),
            minimap: {
                enabled: false,
            },
            automaticLayout: true,
        })
        editor.onDidChangeModelContent(() => {
            const newValue = editor.getValue();
            try {
                const newJsonValue = JSON.parse(newValue)
                value.value = newJsonValue
            } catch (_) {
                return
            }
        })
        editorInstance.value = editor

    })

    onUnmounted(() => {
        // editorInstance.value?.dispose()
    })

    return { value };
    // return { setValue };
}