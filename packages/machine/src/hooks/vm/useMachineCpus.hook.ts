import { useVmStore } from '#store/vm.store'
import { VM_CPUS } from '#types/definitions/vm'

/** How many CPUs the Machine has, as its kernel counts them: X-ray draws one lane per CPU. */
export function useMachineCpus(): number {
  return useVmStore((state) => state.facts?.cpus ?? VM_CPUS)
}
