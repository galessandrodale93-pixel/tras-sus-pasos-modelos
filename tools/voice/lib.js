const fs=require('fs');
function lit(src,name){let i=src.indexOf(name);if(i<0)return null;i=src.indexOf('=',i)+1;while(/\s/.test(src[i]))i++;const open=src[i],close=open==='{'?'}':']';let d=0,q=null,esc=false,tpl=0;
for(let j=i;j<src.length;j++){const c=src[j];if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
 if(c==="'"||c==='"'||c==='`'){q=c;continue} if(c==='/'&&src[j+1]==='/'){j=src.indexOf('\n',j);continue}
 if(c===open||c==='{'||c==='['||c==='(')d++; else if(c==='}'||c===']'||c===')'){d--; if(d===0)return src.slice(i,j+1);} }
return null;}
module.exports={lit,load:(f)=>fs.readFileSync(f,'utf8')};
