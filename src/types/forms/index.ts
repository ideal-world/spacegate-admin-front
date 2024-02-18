import { UnwrapNestedRefs, reactive } from 'vue'

export * from './serviceForm'
export * from './backendForm'
export * from './instanceConfigForm'
export class DialogForm<T, M = never>  {
  isOpen: boolean = false
  mode?: M
  _data?: T
  constructor(data?: T) {
    this._data = data
  }
  open(data?: T, mode?: M) {
    this.isOpen = true
    this.mode = mode
    if (data !== undefined) {
      this._data = data
    }

  }

  close() {
    this.isOpen = false
    this.mode = undefined
  }
}

export function useDialogForm<T, M = never>(init?: T): {
  dialogForm: UnwrapNestedRefs<DialogForm<T, M>>
  open(data?: T, mode?: M): void
  close: () => void
} {
  const dialogForm = reactive(new DialogForm<T, M>(init))
  const open = (data?: T, mode?: M) => {
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