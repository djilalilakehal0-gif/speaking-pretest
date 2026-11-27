import base64,os
d=os.path.dirname(os.path.abspath(__file__));f='/tmp/claude-0/f'
faces=[('Archivo Black',400,'ArchivoBlack400'),('DM Mono',400,'DMMono400'),('DM Mono',500,'DMMono500')]+[('Inter',w,f'Inter{w}') for w in(400,500,600,700,800)]
css=''
for fam,w,fn in faces:
    b=base64.b64encode(open(f'{f}/{fn}.woff2','rb').read()).decode()
    css+=f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b}) format('woff2')}}\n"
head=open(d+'/head.html').read().replace('/*FONTS*/',css)
out=head+open(d+'/body.html').read().replace('__EMBLEM__',open(d+'/emblem.b64').read().strip()).replace('__LOGO__',open(d+'/logo.b64').read().strip())+'<script type="module">\n'+open(d+'/app.js').read().replace('__ITEMS__',open(d+'/items.json').read().strip())+'\n</script>\n</body>\n</html>\n'
open(d+'/index.html','w').write(out);print(len(out))
