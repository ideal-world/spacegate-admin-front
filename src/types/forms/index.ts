import { UnwrapNestedRefs, reactive } from 'vue'

export * from './serviceForm'

export class DialogForm<T, M = never>  {
    isOpen: boolean = false
    mode?: M
    data?: T

    open(data: T, mode?: M) {
        this.isOpen = true
        this.mode = mode
        this.data = data
    }

    close() {
        this.isOpen = false
        this.mode = undefined
        this.data = undefined
    }
}

export function useDialogForm<T, M = never>(): {
    dialogForm: UnwrapNestedRefs<DialogForm<T, M>>
    open(data: T, mode?: M): void
    close: () => void
} {
    const dialogForm = reactive(new DialogForm<T, M>())
    const open = (data: T, mode?: M) => {
        dialogForm.open(data, mode)
    }
    return {
        dialogForm,
        open,
        close() {
            dialogForm.close()
        },
    }
}