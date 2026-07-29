/* Minimal but functional THREE stand-in: enough real math and geometry
   for the project's logic to execute headlessly and surface real bugs. */
class V2{constructor(x=0,y=0){this.x=x;this.y=y}set(x,y){this.x=x;this.y=y;return this}}
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
 copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this}
 clone(){return new V3(this.x,this.y,this.z)}
 add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}
 addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this}
 multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}
 length(){return Math.hypot(this.x,this.y,this.z)}
 normalize(){const l=this.length()||1;return this.multiplyScalar(1/l)}
 setScalar(s){this.x=s;this.y=s;this.z=s;return this}
 lerp(v,t){this.x+=(v.x-this.x)*t;this.y+=(v.y-this.y)*t;this.z+=(v.z-this.z)*t;return this}
 applyEuler(){return this} applyMatrix4(){return this}
 applyQuaternion(q){const{x,y,z}=this,{x:qx,y:qy,z:qz,w:qw}=q;
  const ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;
  this.x=ix*qw+iw*-qx+iy*-qz-iz*-qy;this.y=iy*qw+iw*-qy+iz*-qx-ix*-qz;
  this.z=iz*qw+iw*-qz+ix*-qy-iy*-qx;return this} distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z)}}
class Color{constructor(c){this.r=1;this.g=1;this.b=1;if(c!==undefined)this.setHex(c)}
 setHex(h){this.r=((h>>16)&255)/255;this.g=((h>>8)&255)/255;this.b=(h&255)/255;return this}
 setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this}
 setHSL(){return this} copy(c){this.r=c.r;this.g=c.g;this.b=c.b;return this}
 clone(){const c=new Color();return c.copy(this)}
 lerp(c,t){this.r+=(c.r-this.r)*t;this.g+=(c.g-this.g)*t;this.b+=(c.b-this.b)*t;return this}
 offsetHSL(){return this} multiplyScalar(s){this.r*=s;this.g*=s;this.b*=s;return this} getHex(){return 0}}
class Euler{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}}
class Quat{constructor(){this.x=0;this.y=0;this.z=0;this.w=1}
 set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}
 setFromEuler(e){const c1=Math.cos(e.x/2),c2=Math.cos(e.y/2),c3=Math.cos(e.z/2);
  const s1=Math.sin(e.x/2),s2=Math.sin(e.y/2),s3=Math.sin(e.z/2);
  this.x=s1*c2*c3+c1*s2*s3;this.y=c1*s2*c3-s1*c2*s3;
  this.z=c1*c2*s3+s1*s2*c3;this.w=c1*c2*c3-s1*s2*s3;return this}
 copy(q){this.x=q.x;this.y=q.y;this.z=q.z;this.w=q.w;return this}}
class M4{constructor(){this.elements=new Float32Array(16)}
 compose(){return this} identity(){return this} makeRotationFromEuler(){return this}
 setPosition(){return this} multiply(){return this} copy(){return this}}
class Attr{constructor(a,i){this.array=a;this.itemSize=i;this.count=a.length/i;this.needsUpdate=false}
 setXYZ(i,x,y,z){this.array[i*3]=x;this.array[i*3+1]=y;this.array[i*3+2]=z}
 setUsage(){return this}}
class Geo{constructor(n=36){this._n=n;this.attributes={};this.index=null;
  const p=new Float32Array(n*3);for(let i=0;i<n*3;i++)p[i]=((i*37)%23)/23-0.5;
  this.attributes.position=new Attr(p,3);this.attributes.normal=new Attr(new Float32Array(n*3),3);}
 setAttribute(k,a){this.attributes[k]=a;return this}
 getAttribute(k){return this.attributes[k]}
 computeVertexNormals(){return this} rotateX(){return this} applyMatrix4(){return this}
 toNonIndexed(){return this} clone(){const g=new Geo(this._n);return g} dispose(){}}
class PlaneGeo extends Geo{constructor(w=1,h=1,sx=1,sz=1){
  const cols=sx+1,rows=sz+1,n=cols*rows;super(n);
  const p=new Float32Array(n*3);
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const i=r*cols+c;
    p[i*3]=-w/2+w*c/sx;p[i*3+1]=0;p[i*3+2]=-h/2+h*r/sz;}
  this.attributes.position=new Attr(p,3);
  this.attributes.normal=new Attr(new Float32Array(n*3),3);}}
class Obj3{constructor(){this.position=new V3();this.rotation=new Euler();this.scale=new V3(1,1,1);
 this.children=[];this.userData={};this.visible=true;this.material=null;this.parent=null}
 add(...o){o.forEach(c=>{if(c){c.parent=this;this.children.push(c)}});return this}
 remove(){return this} traverse(f){f(this);this.children.forEach(c=>c.traverse&&c.traverse(f))}
 lookAt(){} updateMatrixWorld(){} setPointerCapture(){} copy(v){this.position.copy(v);return this}}
class Mesh extends Obj3{constructor(g,m){super();this.geometry=g;this.material=m;this.castShadow=false;this.receiveShadow=false;this.frustumCulled=true;this.renderOrder=0}}
class Inst extends Mesh{constructor(g,m,c){super(g,m);this.count=c;this.instanceMatrix=new Attr(new Float32Array(c*16),16);this.instanceColor=null}
 setMatrixAt(){} getMatrixAt(){}}
function Mat(p){Object.assign(this,{color:new Color(),roughness:1,metalness:0,opacity:1,transparent:false,
 emissive:new Color(),emissiveIntensity:0,side:0,depthWrite:true,needsUpdate:false,userData:{},uniforms:{}},p||{});
 if(p&&typeof p.color==='number')this.color=new Color(p.color);
 if(p&&typeof p.emissive==='number')this.emissive=new Color(p.emissive);}
Mat.prototype.clone=function(){return new Mat(this)};Mat.prototype.dispose=function(){};
class Light extends Obj3{constructor(c,i){super();this.color=new Color(c);this.intensity=i||1;
 this.castShadow=false;this.target=new Obj3();
 this.shadow={mapSize:{set(){}},camera:{updateProjectionMatrix(){}},bias:0,normalBias:0}}}
const T={
 Vector2:V2,Vector3:V3,Color,Euler,Quaternion:Quat,Matrix4:M4,
 BufferGeometry:Geo,BufferAttribute:Attr,InstancedBufferAttribute:Attr,
 Float32BufferAttribute:class extends Attr{constructor(a,i){super(new Float32Array(a),i)}},
 BoxGeometry:class extends Geo{constructor(){super(36)}},
 PlaneGeometry:PlaneGeo,
 CylinderGeometry:class extends Geo{constructor(){super(48)}},
 ConeGeometry:class extends Geo{constructor(){super(27)}},
 SphereGeometry:class extends Geo{constructor(){super(60)}},
 IcosahedronGeometry:class extends Geo{constructor(){super(60)}},
 EdgesGeometry:class extends Geo{constructor(){super(24)}},
 Object3D:Obj3,Group:Obj3,Mesh,InstancedMesh:Inst,Points:Mesh,LineSegments:Mesh,
 Sprite:class extends Mesh{constructor(m){super(new Geo(6),m)}},
 MeshStandardMaterial:Mat,MeshBasicMaterial:Mat,PointsMaterial:Mat,SpriteMaterial:Mat,
 LineBasicMaterial:Mat,ShaderMaterial:Mat,
 Scene:class extends Obj3{constructor(){super();this.fog=null;this.environment=null;this.background=null}},
 PerspectiveCamera:class extends Obj3{constructor(f){super();this.fov=f;this.aspect=1;this.updateProjectionMatrix=()=>{}}},
 Fog:class{constructor(c,n,f){this.color=new Color(c);this.near=n;this.far=f}},
 HemisphereLight:Light,DirectionalLight:Light,AmbientLight:Light,PointLight:Light,
 Raycaster:class{setFromCamera(){}intersectObjects(){return[]}},
 CanvasTexture:class{constructor(){this.wrapS=0;this.wrapT=0;this.repeat=new V2(1,1);this.anisotropy=1;this.encoding=0;this.needsUpdate=false;this.offset=new V2()}dispose(){}},
 Texture:class{constructor(){this.repeat=new V2(1,1);this.offset=new V2()}},
 PMREMGenerator:class{constructor(){}compileEquirectangularShader(){}fromScene(){return{texture:{}}}dispose(){}},
 UniformsUtils:{clone:u=>JSON.parse(JSON.stringify({}))||{}},
 WebGLRenderer:class{constructor(o){this.capabilities={getMaxAnisotropy:()=>8};this.shadowMap={enabled:false,type:0};
  this.domElement=o&&o.canvas}
  setPixelRatio(){}setSize(){}render(){}setClearColor(){}compile(){}},
 sRGBEncoding:1,LinearEncoding:0,ACESFilmicToneMapping:1,PCFSoftShadowMap:1,PCFShadowMap:2,
 DoubleSide:2,FrontSide:0,BackSide:1,AdditiveBlending:2,NormalBlending:1,
 RepeatWrapping:1000,LinearFilter:1006,LinearMipmapLinearFilter:1008,RGBAFormat:1023,
 DynamicDrawUsage:35048,StaticDrawUsage:35044,MathUtils:{lerp:(a,b,t)=>a+(b-a)*t}
};
T.UniformsUtils.clone=function(u){const o={};for(const k in u)o[k]={value:u[k].value};return o};
module.exports=T;
