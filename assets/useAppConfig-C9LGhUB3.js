import{l as n,P as u,k as e,K as r}from"./index-Crbp7rJW.js";import{u as i}from"./useQuery-BhzQ8Lbv.js";import{u as p}from"./useMutation-Dgx50M66.js";/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=n("Save",[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]]),t="https://api.jothisham.com/api/v1",o=()=>({Authorization:`Bearer ${r.getState().accessToken}`});function y(){return i({queryKey:["app-config"],queryFn:()=>e.get(`${t}/app-config`,{headers:o()}).then(a=>a.data.data)})}function m(){const a=u();return p({mutationFn:s=>e.put(`${t}/app-config`,s,{headers:o()}),onSuccess:()=>{a.invalidateQueries({queryKey:["app-config"]}),alert("✅ Saved")}})}export{f as S,m as a,y as u};
