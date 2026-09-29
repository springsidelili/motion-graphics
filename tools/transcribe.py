import sherpa_onnx, soundfile as sf, json, sys
d='sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8'
rec=sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{d}/encoder.int8.onnx',decoder=f'{d}/decoder.int8.onnx',joiner=f'{d}/joiner.int8.onnx',tokens=f'{d}/tokens.txt',model_type='nemo_transducer',num_threads=4)
out={}
for i in [int(x) for x in sys.argv[1:]]:
    a,sr=sf.read(f'wav/m{i}.wav',dtype='float32')
    s=rec.create_stream(); s.accept_waveform(sr,a); rec.decode_stream(s)
    r=s.result
    toks=list(r.tokens); ts=list(r.timestamps); durs=list(getattr(r,'durations',[]) or [])
    # merge tokens into words (sentencepiece '▁' marks word start)
    words=[]
    for k,(tk,t0) in enumerate(zip(toks,ts)):
        dur=durs[k] if k<len(durs) else 0.08
        if tk.startswith(' ') or tk.startswith('▁') or not words:
            words.append({'w':tk.strip().lstrip('▁'),'start':round(t0,3),'end':round(t0+dur,3)})
        else:
            words[-1]['w']+=tk; words[-1]['end']=round(t0+dur,3)
    out[i]={'text':r.text,'words':words,'dur':len(a)/sr}
    print(f'=== media{i} ({len(a)/sr:.1f}s)\n{r.text}\n',flush=True)
json.dump(out,open('transcript_'+'_'.join(sys.argv[1:])+'.json','w'),indent=1)
