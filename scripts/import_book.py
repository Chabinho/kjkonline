"""Import the user-supplied legacy ZIP as text and local illustrations.
Usage: python scripts/import_book.py path/to/kiralynok_utvesztoje.zip
Requires: python -m pip install -r scripts/requirements.txt
No source JavaScript or HTML is executed or served.
"""
from pathlib import Path, PurePosixPath
from bs4 import BeautifulSoup
import hashlib,json,re,sys,zipfile
root=Path(__file__).resolve().parents[1]
archive=Path(sys.argv[1])
out={};rules=[]
with zipfile.ZipFile(archive) as z:
    if sum(i.file_size for i in z.infolist())>100_000_000:raise ValueError('Archive too large')
    for entry in z.infolist():
        path=PurePosixPath(entry.filename)
        if path.is_absolute() or '..' in path.parts:raise ValueError('Unsafe archive path')
        if entry.is_dir():continue
        if path.suffix.lower()!='.htm':continue
        k=path.stem
        if not(k[0].isdigit() or k.startswith('start') or k=='help-in'):continue
        soup=BeautifulSoup(z.read(entry).decode('cp1250'),'html.parser')
        for tag in soup(['script','style','head']):tag.decompose()
        paragraphs=[];previous=None
        for text in soup.find_all(string=True):
            value=re.sub(r'\s+',' ',str(text)).strip()
            if not value:continue
            parent=text.find_parent(['p','td'])
            key=id(parent) if parent else 0
            if key==previous:paragraphs[-1]+=' '+value
            else:paragraphs.append(value)
            previous=key
        if k=='help-in':rules=paragraphs;continue
        choices=[]
        for a in soup.select('a[href]'):
            href=a['href']
            if not re.fullmatch(r'[\w]+\.htm',href):continue
            target=href[:-4]
            if target in ['intro','index2',k] or any(c['target']==target for c in choices):continue
            label=re.sub(r'\s+',' ',a.get_text(' ',strip=True)).strip('- .! ')
            if not label:label={'12':'A kérdőjeles ajtó','194':'A kaszát ábrázoló ajtó','272':'A lóherés ajtó','73':'A poharas ajtó','325':'A kulcsos ajtó','430':'A koporsós ajtó','377':'A fejet ábrázoló ajtó','225':'A szemes ajtó'}.get(target,'Belépek az ajtón')
            if 'KATTINTS' in label.upper():label=target.replace('_',' / ')+'. pontra lapozok'
            choices.append({'text':label,'target':target})
        out[k]={'id':k,'title':{'1':'Az Útvesztő kapuja','start':'Yuron sötét napjai','start_2':'Az elhatározás','start_3':'Az indulás','start_4':'A kapu előtt'}.get(k,k.replace('_',' · ')+'. fejezet'),'paragraphs':paragraphs,'choices':choices,'images':[a['src'] for a in soup.select('img[src]') if a['src'].startswith('illustration/')],'ending':k=='356_end_3','fatal':not choices and k!='356_end_3'}
(root/'src/game/pages.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
(root/'src/game/original-rules.json').write_text(json.dumps(rules,ensure_ascii=False,indent=2))
missing=[{'from':k,'to':c['target']} for k,s in out.items() for c in s['choices'] if c['target'] not in out]
(root/'docs/source-audit.json').write_text(json.dumps({'pages':len(out),'missing_links':missing,'source':archive.name,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'encoding':'windows-1250','author':'Martin Stone D.','adaptation':'All text retained in document order; scripts and remote forms discarded.'},ensure_ascii=False,indent=2))
print(f'Imported {len(out)} pages. Missing source targets: {missing}')
