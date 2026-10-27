// Small RFC 4180-style parser: quoted commas, escaped quotes and CRLF supported.
export function parseCsv(input: string): string[][] {
  const text=input.replace(/^\uFEFF/,"");const rows:string[][]=[];let row:string[]=[],field="",quoted=false,closed=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
    if(c==='"'){if(field||closed)throw new Error("Invalid CSV quotes");quoted=true;}
    else if(c===","){row.push(field.trim());field="";closed=false;}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field.trim());if(row.some(Boolean))rows.push(row);row=[];field="";closed=false;}
    else{if(closed&&!/\s/.test(c))throw new Error("Invalid CSV field");field+=c;}
    if(rows.length>500)throw new Error("Too many rows");
  }
  if(quoted)throw new Error("Unclosed CSV quote");row.push(field.trim());if(row.some(Boolean))rows.push(row);return rows;
}
export function csvCell(value:unknown){const text=String(value??"");const safe=/^[\s]*[=+@-]/.test(text)?`'${text}`:text;return `"${safe.replaceAll('"','""')}"`;}
export function toCsv(rows:unknown[][]){return "\uFEFF"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n");}
