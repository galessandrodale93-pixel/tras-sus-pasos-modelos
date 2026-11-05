var e=globalThis.__THREE,P=e.ACESFilmicToneMapping,$=e.AddEquation,ee=e.AddOperation,te=e.AdditiveAnimationBlendMode,E=e.AdditiveBlending,U=e.AgXToneMapping,re=e.AlphaFormat,oe=e.AlwaysCompare,ae=e.AlwaysDepth,se=e.AlwaysStencilFunc,ie=e.AmbientLight,ne=e.AnimationAction,pe=e.AnimationClip,le=e.AnimationLoader,ce=e.AnimationMixer,ue=e.AnimationObjectGroup,he=e.AnimationUtils,xe=e.ArcCurve,me=e.ArrayCamera,fe=e.ArrowHelper,de=e.AttachedBindMode,ge=e.Audio,Ce=e.AudioAnalyser,Se=e.AudioContext,Te=e.AudioListener,Me=e.AudioLoader,_e=e.AxesHelper,ve=e.BackSide,Ae=e.BasicDepthPacking,Fe=e.BasicShadowMap,Be=e.BatchedMesh,Re=e.Bone,be=e.BooleanKeyframeTrack,Ge=e.Box2,Le=e.Box3,ye=e.Box3Helper,De=e.BoxGeometry,Pe=e.BoxHelper,Ee=e.BufferAttribute,w=e.BufferGeometry,Ue=e.BufferGeometryLoader,we=e.ByteType,Ne=e.Cache,Ie=e.Camera,Oe=e.CameraHelper,He=e.CanvasTexture,Ve=e.CapsuleGeometry,ke=e.CatmullRomCurve3,N=e.CineonToneMapping,ze=e.CircleGeometry,We=e.ClampToEdgeWrapping,I=e.Clock,f=e.Color,qe=e.ColorKeyframeTrack,O=e.ColorManagement,Qe=e.CompressedArrayTexture,Ke=e.CompressedCubeTexture,Xe=e.CompressedTexture,je=e.CompressedTextureLoader,Ze=e.ConeGeometry,Ye=e.ConstantAlphaFactor,Je=e.ConstantColorFactor,$e=e.CubeCamera,et=e.CubeReflectionMapping,tt=e.CubeRefractionMapping,rt=e.CubeTexture,ot=e.CubeTextureLoader,at=e.CubeUVReflectionMapping,st=e.CubicBezierCurve,it=e.CubicBezierCurve3,nt=e.CubicInterpolant,pt=e.CullFaceBack,lt=e.CullFaceFront,ct=e.CullFaceFrontBack,ut=e.CullFaceNone,ht=e.Curve,xt=e.CurvePath,mt=e.CustomBlending,ft=e.CustomToneMapping,dt=e.CylinderGeometry,gt=e.Cylindrical,Ct=e.Data3DTexture,St=e.DataArrayTexture,Tt=e.DataTexture,Mt=e.DataTextureLoader,_t=e.DataUtils,vt=e.DecrementStencilOp,At=e.DecrementWrapStencilOp,Ft=e.DefaultLoadingManager,Bt=e.DepthFormat,Rt=e.DepthStencilFormat,bt=e.DepthTexture,Gt=e.DetachedBindMode,Lt=e.DirectionalLight,yt=e.DirectionalLightHelper,Dt=e.DiscreteInterpolant,Pt=e.DisplayP3ColorSpace,Et=e.DodecahedronGeometry,Ut=e.DoubleSide,wt=e.DstAlphaFactor,Nt=e.DstColorFactor,It=e.DynamicCopyUsage,Ot=e.DynamicDrawUsage,Ht=e.DynamicReadUsage,Vt=e.EdgesGeometry,kt=e.EllipseCurve,zt=e.EqualCompare,Wt=e.EqualDepth,qt=e.EqualStencilFunc,Qt=e.EquirectangularReflectionMapping,Kt=e.EquirectangularRefractionMapping,Xt=e.Euler,jt=e.EventDispatcher,Zt=e.ExtrudeGeometry,Yt=e.FileLoader,Jt=e.Float16BufferAttribute,b=e.Float32BufferAttribute,$t=e.Float64BufferAttribute,er=e.FloatType,tr=e.Fog,rr=e.FogExp2,or=e.FramebufferTexture,ar=e.FrontSide,sr=e.Frustum,ir=e.GLBufferAttribute,nr=e.GLSL1,pr=e.GLSL3,lr=e.GreaterCompare,cr=e.GreaterDepth,ur=e.GreaterEqualCompare,hr=e.GreaterEqualDepth,xr=e.GreaterEqualStencilFunc,mr=e.GreaterStencilFunc,fr=e.GridHelper,dr=e.Group,g=e.HalfFloatType,gr=e.HemisphereLight,Cr=e.HemisphereLightHelper,Sr=e.IcosahedronGeometry,Tr=e.ImageBitmapLoader,Mr=e.ImageLoader,_r=e.ImageUtils,vr=e.IncrementStencilOp,Ar=e.IncrementWrapStencilOp,Fr=e.InstancedBufferAttribute,Br=e.InstancedBufferGeometry,Rr=e.InstancedInterleavedBuffer,br=e.InstancedMesh,Gr=e.Int16BufferAttribute,Lr=e.Int32BufferAttribute,yr=e.Int8BufferAttribute,Dr=e.IntType,Pr=e.InterleavedBuffer,Er=e.InterleavedBufferAttribute,Ur=e.Interpolant,wr=e.InterpolateDiscrete,Nr=e.InterpolateLinear,Ir=e.InterpolateSmooth,Or=e.InvertStencilOp,Hr=e.KeepStencilOp,Vr=e.KeyframeTrack,kr=e.LOD,zr=e.LatheGeometry,Wr=e.Layers,qr=e.LessCompare,Qr=e.LessDepth,Kr=e.LessEqualCompare,Xr=e.LessEqualDepth,jr=e.LessEqualStencilFunc,Zr=e.LessStencilFunc,Yr=e.Light,Jr=e.LightProbe,$r=e.Line,eo=e.Line3,to=e.LineBasicMaterial,ro=e.LineCurve,oo=e.LineCurve3,ao=e.LineDashedMaterial,so=e.LineLoop,io=e.LineSegments,no=e.LinearDisplayP3ColorSpace,po=e.LinearEncoding,lo=e.LinearFilter,co=e.LinearInterpolant,uo=e.LinearMipMapLinearFilter,ho=e.LinearMipMapNearestFilter,xo=e.LinearMipmapLinearFilter,mo=e.LinearMipmapNearestFilter,fo=e.LinearSRGBColorSpace,H=e.LinearToneMapping,go=e.LinearTransfer,Co=e.Loader,So=e.LoaderUtils,To=e.LoadingManager,Mo=e.LoopOnce,_o=e.LoopPingPong,vo=e.LoopRepeat,Ao=e.LuminanceAlphaFormat,Fo=e.LuminanceFormat,Bo=e.MOUSE,Ro=e.Material,bo=e.MaterialLoader,Go=e.MathUtils,Lo=e.Matrix3,yo=e.Matrix4,Do=e.MaxEquation,V=e.Mesh,k=e.MeshBasicMaterial,Po=e.MeshDepthMaterial,Eo=e.MeshDistanceMaterial,Uo=e.MeshLambertMaterial,wo=e.MeshMatcapMaterial,No=e.MeshNormalMaterial,Io=e.MeshPhongMaterial,Oo=e.MeshPhysicalMaterial,Ho=e.MeshStandardMaterial,Vo=e.MeshToonMaterial,ko=e.MinEquation,zo=e.MirroredRepeatWrapping,Wo=e.MixOperation,qo=e.MultiplyBlending,Qo=e.MultiplyOperation,Ko=e.NearestFilter,Xo=e.NearestMipMapLinearFilter,jo=e.NearestMipMapNearestFilter,Zo=e.NearestMipmapLinearFilter,Yo=e.NearestMipmapNearestFilter,Jo=e.NeverCompare,$o=e.NeverDepth,ea=e.NeverStencilFunc,z=e.NoBlending,ta=e.NoColorSpace,ra=e.NoToneMapping,oa=e.NormalAnimationBlendMode,aa=e.NormalBlending,sa=e.NotEqualCompare,ia=e.NotEqualDepth,na=e.NotEqualStencilFunc,pa=e.NumberKeyframeTrack,la=e.Object3D,ca=e.ObjectLoader,ua=e.ObjectSpaceNormalMap,ha=e.OctahedronGeometry,xa=e.OneFactor,ma=e.OneMinusConstantAlphaFactor,fa=e.OneMinusConstantColorFactor,da=e.OneMinusDstAlphaFactor,ga=e.OneMinusDstColorFactor,Ca=e.OneMinusSrcAlphaFactor,Sa=e.OneMinusSrcColorFactor,W=e.OrthographicCamera,Ta=e.P3Primaries,Ma=e.PCFShadowMap,_a=e.PCFSoftShadowMap,va=e.PMREMGenerator,Aa=e.Path,Fa=e.PerspectiveCamera,Ba=e.Plane,Ra=e.PlaneGeometry,ba=e.PlaneHelper,Ga=e.PointLight,La=e.PointLightHelper,ya=e.Points,Da=e.PointsMaterial,Pa=e.PolarGridHelper,Ea=e.PolyhedronGeometry,Ua=e.PositionalAudio,wa=e.PropertyBinding,Na=e.PropertyMixer,Ia=e.QuadraticBezierCurve,Oa=e.QuadraticBezierCurve3,Ha=e.Quaternion,Va=e.QuaternionKeyframeTrack,ka=e.QuaternionLinearInterpolant,za=e.RED_GREEN_RGTC2_Format,Wa=e.RED_RGTC1_Format,qa=e.REVISION,Qa=e.RGBADepthPacking,Ka=e.RGBAFormat,Xa=e.RGBAIntegerFormat,ja=e.RGBA_ASTC_10x10_Format,Za=e.RGBA_ASTC_10x5_Format,Ya=e.RGBA_ASTC_10x6_Format,Ja=e.RGBA_ASTC_10x8_Format,$a=e.RGBA_ASTC_12x10_Format,es=e.RGBA_ASTC_12x12_Format,ts=e.RGBA_ASTC_4x4_Format,rs=e.RGBA_ASTC_5x4_Format,os=e.RGBA_ASTC_5x5_Format,as=e.RGBA_ASTC_6x5_Format,ss=e.RGBA_ASTC_6x6_Format,is=e.RGBA_ASTC_8x5_Format,ns=e.RGBA_ASTC_8x6_Format,ps=e.RGBA_ASTC_8x8_Format,ls=e.RGBA_BPTC_Format,cs=e.RGBA_ETC2_EAC_Format,us=e.RGBA_PVRTC_2BPPV1_Format,hs=e.RGBA_PVRTC_4BPPV1_Format,xs=e.RGBA_S3TC_DXT1_Format,ms=e.RGBA_S3TC_DXT3_Format,fs=e.RGBA_S3TC_DXT5_Format,ds=e.RGB_BPTC_SIGNED_Format,gs=e.RGB_BPTC_UNSIGNED_Format,Cs=e.RGB_ETC1_Format,Ss=e.RGB_ETC2_Format,Ts=e.RGB_PVRTC_2BPPV1_Format,Ms=e.RGB_PVRTC_4BPPV1_Format,_s=e.RGB_S3TC_DXT1_Format,vs=e.RGFormat,As=e.RGIntegerFormat,q=e.RawShaderMaterial,Fs=e.Ray,Bs=e.Raycaster,Rs=e.Rec709Primaries,bs=e.RectAreaLight,Gs=e.RedFormat,Ls=e.RedIntegerFormat,Q=e.ReinhardToneMapping,ys=e.RenderTarget,Ds=e.RepeatWrapping,Ps=e.ReplaceStencilOp,Es=e.ReverseSubtractEquation,Us=e.RingGeometry,ws=e.SIGNED_RED_GREEN_RGTC2_Format,Ns=e.SIGNED_RED_RGTC1_Format,Is=e.SRGBColorSpace,K=e.SRGBTransfer,Os=e.Scene,Hs=e.ShaderChunk,Vs=e.ShaderLib,x=e.ShaderMaterial,ks=e.ShadowMaterial,zs=e.Shape,Ws=e.ShapeGeometry,qs=e.ShapePath,Qs=e.ShapeUtils,Ks=e.ShortType,Xs=e.Skeleton,js=e.SkeletonHelper,Zs=e.SkinnedMesh,Ys=e.Source,Js=e.Sphere,$s=e.SphereGeometry,ei=e.Spherical,ti=e.SphericalHarmonics3,ri=e.SplineCurve,oi=e.SpotLight,ai=e.SpotLightHelper,si=e.Sprite,ii=e.SpriteMaterial,ni=e.SrcAlphaFactor,pi=e.SrcAlphaSaturateFactor,li=e.SrcColorFactor,ci=e.StaticCopyUsage,ui=e.StaticDrawUsage,hi=e.StaticReadUsage,xi=e.StereoCamera,mi=e.StreamCopyUsage,fi=e.StreamDrawUsage,di=e.StreamReadUsage,gi=e.StringKeyframeTrack,Ci=e.SubtractEquation,Si=e.SubtractiveBlending,Ti=e.TOUCH,Mi=e.TangentSpaceNormalMap,_i=e.TetrahedronGeometry,vi=e.Texture,Ai=e.TextureLoader,Fi=e.TorusGeometry,Bi=e.TorusKnotGeometry,Ri=e.Triangle,bi=e.TriangleFanDrawMode,Gi=e.TriangleStripDrawMode,Li=e.TrianglesDrawMode,yi=e.TubeGeometry,Di=e.TwoPassDoubleSide,Pi=e.UVMapping,Ei=e.Uint16BufferAttribute,Ui=e.Uint32BufferAttribute,wi=e.Uint8BufferAttribute,Ni=e.Uint8ClampedBufferAttribute,Ii=e.Uniform,Oi=e.UniformsGroup,Hi=e.UniformsLib,d=e.UniformsUtils,Vi=e.UnsignedByteType,ki=e.UnsignedInt248Type,zi=e.UnsignedIntType,Wi=e.UnsignedShort4444Type,qi=e.UnsignedShort5551Type,Qi=e.UnsignedShortType,Ki=e.VSMShadowMap,c=e.Vector2,C=e.Vector3,Xi=e.Vector4,ji=e.VectorKeyframeTrack,Zi=e.VideoTexture,Yi=e.WebGL1Renderer,Ji=e.WebGL3DRenderTarget,$i=e.WebGLArrayRenderTarget,en=e.WebGLCoordinateSystem,tn=e.WebGLCubeRenderTarget,rn=e.WebGLMultipleRenderTargets,S=e.WebGLRenderTarget,on=e.WebGLRenderer,an=e.WebGLUtils,sn=e.WebGPUCoordinateSystem,nn=e.WireframeGeometry,pn=e.WrapAroundEnding,ln=e.ZeroCurvatureEnding,cn=e.ZeroFactor,un=e.ZeroSlopeEnding,hn=e.ZeroStencilOp,xn=e._SRGBAFormat,mn=e.createCanvasElement,fn=e.sRGBEncoding;var _={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var l=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},Y=new W(-1,1,1,-1,0,1),G=class extends w{constructor(){super(),this.setAttribute("position",new b([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new b([0,2,0,0,2,0],2))}},J=new G,m=class{constructor(t){this._mesh=new V(J,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,Y)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}};var v=class extends l{constructor(t,r){super(),this.textureID=r!==void 0?r:"tDiffuse",t instanceof x?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=d.clone(t.uniforms),this.material=new x({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this.fsQuad=new m(this.material)}render(t,r,a){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=a.texture),this.fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(r),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};var T=class extends l{constructor(t,r){super(),this.scene=t,this.camera=r,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,r,a){let s=t.getContext(),o=t.state;o.buffers.color.setMask(!1),o.buffers.depth.setMask(!1),o.buffers.color.setLocked(!0),o.buffers.depth.setLocked(!0);let i,p;this.inverse?(i=0,p=1):(i=1,p=0),o.buffers.stencil.setTest(!0),o.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),o.buffers.stencil.setFunc(s.ALWAYS,i,4294967295),o.buffers.stencil.setClear(p),o.buffers.stencil.setLocked(!0),t.setRenderTarget(a),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(r),this.clear&&t.clear(),t.render(this.scene,this.camera),o.buffers.color.setLocked(!1),o.buffers.depth.setLocked(!1),o.buffers.color.setMask(!0),o.buffers.depth.setMask(!0),o.buffers.stencil.setLocked(!1),o.buffers.stencil.setFunc(s.EQUAL,1,4294967295),o.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),o.buffers.stencil.setLocked(!0)}},A=class extends l{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}};var L=class{constructor(t,r){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),r===void 0){let a=t.getSize(new c);this._width=a.width,this._height=a.height,r=new S(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:g}),r.texture.name="EffectComposer.rt1"}else this._width=r.width,this._height=r.height;this.renderTarget1=r,this.renderTarget2=r.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new v(_),this.copyPass.material.blending=z,this.clock=new I}swapBuffers(){let t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,r){this.passes.splice(r,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){let r=this.passes.indexOf(t);r!==-1&&this.passes.splice(r,1)}isLastEnabledPass(t){for(let r=t+1;r<this.passes.length;r++)if(this.passes[r].enabled)return!1;return!0}render(t){t===void 0&&(t=this.clock.getDelta());let r=this.renderer.getRenderTarget(),a=!1;for(let s=0,o=this.passes.length;s<o;s++){let i=this.passes[s];if(i.enabled!==!1){if(i.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),i.render(this.renderer,this.writeBuffer,this.readBuffer,t,a),i.needsSwap){if(a){let p=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(p.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),n.setFunc(p.EQUAL,1,4294967295)}this.swapBuffers()}T!==void 0&&(i instanceof T?a=!0:i instanceof A&&(a=!1))}}this.renderer.setRenderTarget(r)}reset(t){if(t===void 0){let r=this.renderer.getSize(new c);this._pixelRatio=this.renderer.getPixelRatio(),this._width=r.width,this._height=r.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,r){this._width=t,this._height=r;let a=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(a,s),this.renderTarget2.setSize(a,s);for(let o=0;o<this.passes.length;o++)this.passes[o].setSize(a,s)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var y=class extends l{constructor(t,r,a=null,s=null,o=null){super(),this.scene=t,this.camera=r,this.overrideMaterial=a,this.clearColor=s,this.clearAlpha=o,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new f}render(t,r,a){let s=t.autoClear;t.autoClear=!1;let o,i;this.overrideMaterial!==null&&(i=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor)),this.clearAlpha!==null&&(o=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:a),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(o),this.overrideMaterial!==null&&(this.scene.overrideMaterial=i),t.autoClear=s}};var X={name:"LuminosityHighPassShader",shaderID:"luminosityHighPass",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new f(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			vec3 luma = vec3( 0.299, 0.587, 0.114 );

			float v = dot( texel.xyz, luma );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};var M=class u extends l{constructor(t,r,a,s){super(),this.strength=r!==void 0?r:1,this.radius=a,this.threshold=s,this.resolution=t!==void 0?new c(t.x,t.y):new c(256,256),this.clearColor=new f(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let o=Math.round(this.resolution.x/2),i=Math.round(this.resolution.y/2);this.renderTargetBright=new S(o,i,{type:g}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let h=0;h<this.nMips;h++){let B=new S(o,i,{type:g});B.texture.name="UnrealBloomPass.h"+h,B.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(B);let R=new S(o,i,{type:g});R.texture.name="UnrealBloomPass.v"+h,R.texture.generateMipmaps=!1,this.renderTargetsVertical.push(R),o=Math.round(o/2),i=Math.round(i/2)}let p=X;this.highPassUniforms=d.clone(p.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new x({uniforms:this.highPassUniforms,vertexShader:p.vertexShader,fragmentShader:p.fragmentShader}),this.separableBlurMaterials=[];let n=[3,5,7,9,11];o=Math.round(this.resolution.x/2),i=Math.round(this.resolution.y/2);for(let h=0;h<this.nMips;h++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(n[h])),this.separableBlurMaterials[h].uniforms.invSize.value=new c(1/o,1/i),o=Math.round(o/2),i=Math.round(i/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=r,this.compositeMaterial.uniforms.bloomRadius.value=.1;let Z=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=Z,this.bloomTintColors=[new C(1,1,1),new C(1,1,1),new C(1,1,1),new C(1,1,1),new C(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;let F=_;this.copyUniforms=d.clone(F.uniforms),this.blendMaterial=new x({uniforms:this.copyUniforms,vertexShader:F.vertexShader,fragmentShader:F.fragmentShader,blending:E,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new f,this.oldClearAlpha=1,this.basic=new k,this.fsQuad=new m(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(t,r){let a=Math.round(t/2),s=Math.round(r/2);this.renderTargetBright.setSize(a,s);for(let o=0;o<this.nMips;o++)this.renderTargetsHorizontal[o].setSize(a,s),this.renderTargetsVertical[o].setSize(a,s),this.separableBlurMaterials[o].uniforms.invSize.value=new c(1/a,1/s),a=Math.round(a/2),s=Math.round(s/2)}render(t,r,a,s,o){t.getClearColor(this._oldClearColor),this.oldClearAlpha=t.getClearAlpha();let i=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),o&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=a.texture,t.setRenderTarget(null),t.clear(),this.fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=a.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this.fsQuad.render(t);let p=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this.fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=p.texture,this.separableBlurMaterials[n].uniforms.direction.value=u.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this.fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=u.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this.fsQuad.render(t),p=this.renderTargetsVertical[n];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this.fsQuad.render(t),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,o&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(a),this.fsQuad.render(t)),t.setClearColor(this._oldClearColor,this.oldClearAlpha),t.autoClear=i}getSeperableBlurMaterial(t){let r=[];for(let a=0;a<t;a++)r.push(.39894*Math.exp(-.5*a*a/(t*t))/t);return new x({defines:{KERNEL_RADIUS:t},uniforms:{colorTexture:{value:null},invSize:{value:new c(.5,.5)},direction:{value:new c(.5,.5)},gaussianCoefficients:{value:r}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(t){return new x({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}};M.BlurDirectionX=new c(1,0);M.BlurDirectionY=new c(0,1);var j={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = OptimizedCineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var D=class extends l{constructor(){super();let t=j;this.uniforms=d.clone(t.uniforms),this.material=new q({name:t.name,uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader}),this.fsQuad=new m(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,r,a){this.uniforms.tDiffuse.value=a.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},O.getTransfer(this._outputColorSpace)===K&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===H?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===Q?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===N?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===P?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===U&&(this.material.defines.AGX_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(r),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};export{L as EffectComposer,D as OutputPass,y as RenderPass,M as UnrealBloomPass};
