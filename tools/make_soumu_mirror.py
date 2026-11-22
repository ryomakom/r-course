import os, re, shutil, sys
stage, repo = sys.argv[1], sys.argv[2]
src = os.path.join(stage, 'soumu_index.html')
s = open(src, 'rb').read().decode('cp932')
xlsx = set(os.listdir(os.path.join(stage, 'soumu.go.jp', 'main_content')))
# 画像（総務省のロゴなど）・スタイル・外部スクリプトを外す
s = re.sub(r'<img[^>]*>', '', s, flags=re.I)
s = re.sub(r'<link[^>]*>', '', s, flags=re.I)
s = re.sub(r'<script[^>]*src=[^>]*>\s*</script>', '', s, flags=re.I)
# 保存したExcelへのリンクは保存版の中を指すように、それ以外の総務省内のリンクは本物のサイトを指すように
def fix(m):
    q, path = m.group(1), m.group(2)
    name = path.rsplit('/', 1)[-1]
    if path.startswith('/main_content/') and name in xlsx:
        return 'href=%s../../../../main_content/%s%s' % (q, name, q)
    return 'href=%shttps://www.soumu.go.jp%s%s' % (q, path, q)
s = re.sub(r'href=(["\'])(/[^"\']*)\1', fix, s)
notice = '''<div style="border:2px solid #c00;padding:8px 12px;margin:8px;font-size:14px;line-height:1.6;background:#fff">
<p style="margin:0"><strong>これは「記者のためのR講座」が保存した写しです。</strong>元のページ：<a href="https://www.soumu.go.jp/senkyo/senkyo_s/data/shugiin50/shikuchouson.html">https://www.soumu.go.jp/senkyo/senkyo_s/data/shugiin50/shikuchouson.html</a>（2026年11月22日に取得）</p>
<p style="margin:0">出典：総務省「第50回衆議院議員総選挙・最高裁判所裁判官国民審査 市区町村別得票数」、<a href="https://www.digital.go.jp/resources/open_data/public_data_license_v1.0">公共データ利用規約（第1.0版）</a>。Excelファイルへのリンクをこの写しの中で開けるように書き換え、画像などを外しています（加工：記者のためのR講座）。Excelファイルは元のまま。</p>
</div>'''
s = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + notice, s, count=1, flags=re.I)
s = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + '<meta name="robots" content="noindex">', s, count=1, flags=re.I)
s = re.sub(r'<title>', '<title>【保存版・記者のためのR講座】', s, count=1, flags=re.I)
assert 'noindex' in s and '記者のためのR講座' in s
out = os.path.join(repo, 'mirror', 'soumu.go.jp')
os.makedirs(os.path.join(out, 'senkyo', 'senkyo_s', 'data', 'shugiin50'), exist_ok=True)
os.makedirs(os.path.join(out, 'main_content'), exist_ok=True)
open(os.path.join(out, 'senkyo', 'senkyo_s', 'data', 'shugiin50', 'shikuchouson.html'), 'wb').write(s.encode('cp932'))
for n in xlsx:
    shutil.copy2(os.path.join(stage, 'soumu.go.jp', 'main_content', n), os.path.join(out, 'main_content', n))
print('xlsx', len(xlsx), 'img left', len(re.findall('<img', s, re.I)), 'root links left', len(re.findall(r'href="/', s)))
