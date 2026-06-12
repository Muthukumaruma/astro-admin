import{h,t as r,o as e,X as g}from"./index-BTMeuuc6.js";import{u as f}from"./cms.api-B5m1G6Qp.js";/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=h("Image",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]]);/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=h("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);function N({value:a,onChange:i,label:l,aspectClassName:p="aspect-video"}){const c=r.useRef(null),[o,n]=r.useState(!1),[d,m]=r.useState("");async function u(t){m(""),n(!0);try{const s=await f(t);i(s)}catch{m("Upload failed — try a smaller image (max 5MB)")}finally{n(!1)}}return e.jsxs("div",{className:"space-y-1.5",children:[l&&e.jsx("p",{className:"text-xs text-white/50",children:l}),e.jsxs("div",{onClick:()=>{var t;return(t=c.current)==null?void 0:t.click()},className:`${p} w-full rounded-xl border border-dashed border-white/15 bg-white/5 hover:bg-white/10
          cursor-pointer overflow-hidden relative flex items-center justify-center transition-colors`,children:[a?e.jsx("img",{src:a,alt:"",className:"w-full h-full object-cover"}):e.jsxs("div",{className:"flex flex-col items-center gap-1.5 text-white/30",children:[e.jsx(j,{className:"w-6 h-6"}),e.jsx("span",{className:"text-xs",children:"Click to upload image"})]}),o&&e.jsx("div",{className:"absolute inset-0 bg-black/60 flex items-center justify-center",children:e.jsx(w,{className:"w-5 h-5 text-white animate-spin"})}),a&&!o&&e.jsx("button",{type:"button",onClick:t=>{t.stopPropagation(),i("")},className:"absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white/70 hover:text-white hover:bg-black/80 transition-colors",children:e.jsx(g,{className:"w-3.5 h-3.5"})})]}),e.jsx("input",{ref:c,type:"file",accept:"image/png,image/jpeg,image/webp",className:"hidden",onChange:t=>{var x;const s=(x=t.target.files)==null?void 0:x[0];s&&u(s),t.target.value=""}}),d&&e.jsx("p",{className:"text-red-400 text-xs",children:d})]})}export{N as C,j as I,w as L};
