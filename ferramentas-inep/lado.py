# Junta as imagens de algumas questões lado a lado (para revisar de uma vez).
import sys
from PIL import Image
saida, *arqs = sys.argv[1:]
ims = [Image.open(a) for a in arqs]
H = min(1400, max(i.height for i in ims))
ims = [i if i.height <= H else i.resize((int(i.width * H / i.height), H)) for i in ims]
W = sum(i.width for i in ims) + 8 * (len(ims) - 1)
out = Image.new('RGB', (W, H), (90, 90, 90)); x = 0
for i in ims: out.paste(i, (x, 0)); x += i.width + 8
out.save(saida)
