export interface Statistics {
  backend_count: number;
  gateway_count: number;
  route_count: number;
  plugin_count: number;
  tls_count: number;
  instance_count: number;
}

/**
 * Formats a Kubernetes object's name and namespace into a unique identifier.
 *
 * @param {string} namespace - The namespace of the Kubernetes object.
 * @param {string} name - The name of the Kubernetes object.
 * @throws {Error} Throws an error if either the name or namespace is empty.
 * @return {string} The unique identifier of the Kubernetes object.
 */
export function formatK8sObjUnique(namespace: string,name: string) {
  if(!name||!namespace) {
    throw new Error("formatK8sObjUnique failed - name or namespace is empty");
  }
  const result = [namespace,name].join('.');
    return result;  
}

/**
 * Parses a Kubernetes object unique name and returns an array with two elements.
 *
 * @param {string} uniqueName - The unique name of the Kubernetes object.
 * @return {string[]} An array containing two elements: the first element is the first part of the unique name, and the second element is the second part of the unique name.
 */
export function parseK8sObjUnique(uniqueName: string)  {
  if(!uniqueName) {
    throw new Error("parseK8sObjUnique failed - uniqueName is empty");
  }
  const result = uniqueName.split('.'); 
    if (result.length !== 2) {  
        throw new Error("parseK8sObjUnique failed - split failed");  
    }  
    return [result[0], result[1]];  
}
