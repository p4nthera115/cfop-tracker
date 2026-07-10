import re, json, copy

def rx(v,s):  x,y,z=v; return (x, -s*z, s*y)      # s=+1 -> Rx(+90)
def ry(v,s):  x,y,z=v; return (s*z, y, -s*x)
def rz(v,s):  x,y,z=v; return (-s*y, s*x, z)
ROT={'x':rx,'y':ry,'z':rz}

# face -> (axis, layer_predicate, sign for clockwise)
FACES={
 'U':('y',lambda p:p[1]==1,-1), 'D':('y',lambda p:p[1]==-1,1),
 'R':('x',lambda p:p[0]==1,-1), 'L':('x',lambda p:p[0]==-1,1),
 'F':('z',lambda p:p[2]==1,-1), 'B':('z',lambda p:p[2]==-1,1),
}
WIDE={
 'u':('y',lambda p:p[1]>=0,-1), 'd':('y',lambda p:p[1]<=0,1),
 'r':('x',lambda p:p[0]>=0,-1), 'l':('x',lambda p:p[0]<=0,1),
 'f':('z',lambda p:p[2]>=0,-1), 'b':('z',lambda p:p[2]<=0,1),
}
SLICE={'M':('x',lambda p:p[0]==0,1), 'E':('y',lambda p:p[1]==0,1), 'S':('z',lambda p:p[2]==0,-1)}
ROTS={'x':('x',lambda p:True,-1), 'y':('y',lambda p:True,-1), 'z':('z',lambda p:True,-1)}
ALL={**FACES,**WIDE,**SLICE,**ROTS}

COLOR={(0,1,0):'Y',(0,-1,0):'W',(0,0,1):'G',(0,0,-1):'B',(1,0,0):'R',(-1,0,0):'O'}

def solved():
    st=[]
    for x in(-1,0,1):
        for y in(-1,0,1):
            for z in(-1,0,1):
                for n in COLOR:
                    if sum(a*b for a,b in zip((x,y,z),n))==1:
                        st.append([(x,y,z),n,COLOR[n]])
    return st

def turn(st,face,amount):
    axis,pred,s=ALL[face]
    f=ROT[axis]
    for _ in range(amount%4):
        for stk in st:
            if pred(stk[0]):
                stk[0]=f(stk[0],s); stk[1]=f(stk[1],s)
    return st

TOK=re.compile(r"([UDRLFBudrlfbMESxyz])(w?)(2?)('?)(2?)")
def parse(alg):
    alg=alg.replace('(',' ').replace(')',' ').replace('[',' ').replace(']',' ').replace('+',' ').replace('â',"'")
    out=[]
    for m in TOK.finditer(alg):
        f,w,d1,p,d2=m.groups()
        if w: f=f.lower()
        amt=1
        if d1 or d2: amt=2
        if p: amt=-amt
        out.append((f,amt))
    return out

def invert(mv): return [(f,-a) for f,a in reversed(mv)]

def apply(st,mv):
    for f,a in mv: turn(st,f,a)
    return st

def normalize(st):
    # rotate whole cube so U center yellow, F center green
    for _ in range(4):
        for _ in range(4):
            u=[s for s in st if s[0]==(0,1,0)][0][2]
            f=[s for s in st if s[0]==(0,0,1)][0][2]
            if u=='Y' and f=='G': return st
            turn(st,'y',1)
        turn(st,'x',1)
    raise Exception('bad')

def f2l_solved(st):
    for pos,n,c in st:
        if pos[1]<1 and COLOR[n]!=c: return False
    return True

def grid(st):
    g=[[None]*5 for _ in range(5)]
    for pos,n,c in st:
        if pos[1]!=1: continue
        x,y,z=pos
        if n==(0,1,0): g[z+2][x+2]=c
        elif n==(0,0,-1): g[0][x+2]=c
        elif n==(0,0,1): g[4][x+2]=c
        elif n==(-1,0,0): g[z+2][0]=c
        elif n==(1,0,0): g[z+2][4]=c
    return g
