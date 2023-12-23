import { Ref, ref } from "vue";
import { ApiType, OptionItem, getOptions } from "../service";

export function useOptions(apiType: ApiType): {
    update: () => Promise<void>;
    options: Ref<OptionItem[]>
} {
    const options = ref(<OptionItem[]>[])
    const update = async () => {
        options.value = await getOptions(apiType)
    }
    update()
    return {
        options,
        update
    }
}