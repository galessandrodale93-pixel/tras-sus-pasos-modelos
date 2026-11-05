import bpy,sys,os,json,math
from mathutils import Vector
R='/tmp/claude-0/ph/raw'; O='/tmp/claude-0/ph/out'
# id: (tris por objeto, textura px, normal, unir)
P={}
for i in 'food_avocado_01 food_kiwi_01 lemon wooden_spoon wooden_bowl_02 wooden_axe wooden_cutting_board carrot_cake'.split(): P[i]=(900,256,False,True)
P['food_pears_asian_01']=(500,256,False,False)
P['wooden_candlestick']=(700,256,False,True); P['Lantern_01']=(1200,256,False,True)
for i in 'wooden_bucket_02 wooden_stool_02 wicker_basket_01 treasure_chest stone_fire_pit'.split(): P[i]=(2500,512,True,True)
P['brass_candleholders']=(1200,512,False,False)
P['modular_wooden_pier']=(2500,512,True,False)
for i in 'celandine_01 grass_bermuda_01 grass_medium_01 grass_medium_02 nettle_plant wild_rooibos_bush'.split(): P[i]=(700,512,False,False)
for i in 'dandelion_01 flower_heliophila leipoldtia_schultzei'.split(): P[i]=(1500,256,False,False)
P['searsia_burchellii']=(6000,512,False,False); P['pine_sapling_small']=(3000,512,False,False)
for i in 'rock_face_01 rock_face_02 namaqualand_boulder_02 sand_rocks_small_01 coast_rocks_05'.split(): P[i]=(3000,512,True,True)
for i in 'mountainside coast_land_rocks_02 coast_land_rocks_03 coast_land_rocks_04'.split(): P[i]=(5000,512,True,True)
for i in 'coastal_cliff_02 coastal_cliff_04'.split(): P[i]=(9000,1024,True,True)
for i in 'dead_tree_trunk dead_tree_trunk_02 tree_stump_01 quiver_tree_02'.split(): P[i]=(3000,512,True,True)
P['quiver_tree_01']=(5000,512,True,True)
for i in 'island_tree_01 island_tree_03 tree_small_02'.split(): P[i]=(14000,512,False,True)
P['jacaranda_tree']=(18000,512,False,True)
only=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
rep={}
for aid,(T,TX,NOR,JOIN) in P.items():
    if only and aid not in only: continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    pre='/tmp/claude-0/ph/pre/'+aid+'.gltf'
    bpy.ops.import_scene.gltf(filepath=pre if os.path.exists(pre) else os.path.join(R,aid,aid+'.gltf'))
    obs=[o for o in bpy.data.objects if o.type=='MESH']
    for o in bpy.data.objects:
        o.select_set(False)
    # aplicar transformaciones
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active=obs[0]
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    if JOIN and len(obs)>1:
        bpy.ops.object.join(); obs=[bpy.context.view_layer.objects.active]
    for o in obs:
        n=sum(len(p.vertices)-2 for p in o.data.polygons)
        if n>T:
            m=o.modifiers.new('d','DECIMATE'); m.ratio=max(0.0005,T/n); m.use_collapse_triangulate=True
            bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier='d')
        # origen: centro abajo
        ws=[o.matrix_world@v.co for v in o.data.vertices]
        mn=Vector((min(v.x for v in ws),min(v.y for v in ws),min(v.z for v in ws))); mx=Vector((max(v.x for v in ws),max(v.y for v in ws),max(v.z for v in ws)))
        c=Vector(((mn.x+mx.x)/2,(mn.y+mx.y)/2,mn.z))
        o.data.transform(__import__('mathutils').Matrix.Translation(-(c-o.location)) if False else __import__('mathutils').Matrix.Translation(-c+o.location*0))
        o.location=(0,0,0)
    # materiales: solo color base (+normal) y alpha
    for mat in bpy.data.materials:
        if not mat.use_nodes: continue
        nt=mat.node_tree; bs=[n for n in nt.nodes if n.type=='BSDF_PRINCIPLED']
        for b in bs:
            for k in ('Roughness','Metallic','Specular IOR Level','Transmission Weight'):
                if k in b.inputs:
                    for l in list(b.inputs[k].links): nt.links.remove(l)
            b.inputs['Roughness'].default_value=.88; b.inputs['Metallic'].default_value=0
            if not NOR and 'Normal' in b.inputs:
                for l in list(b.inputs['Normal'].links): nt.links.remove(l)
        for n in list(nt.nodes):
            if n.type=='TEX_IMAGE' and not n.outputs[0].links and not n.outputs[1].links: nt.nodes.remove(n)
    for img in bpy.data.images:
        if img.size[0]>TX: img.scale(TX,max(1,int(img.size[1]*TX/img.size[0])))
    for img in list(bpy.data.images):
        if img.users==0: bpy.data.images.remove(img)
    out=os.path.join(O,aid+'.raw.glb')
    bpy.ops.export_scene.gltf(filepath=out,export_format='GLB',export_image_format='WEBP',export_yup=True,export_apply=True,export_animations=False,export_materials='EXPORT',use_selection=False)
    tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.data.objects if o.type=='MESH')
    dims=[]
    for o in [o for o in bpy.data.objects if o.type=='MESH']:
        d=o.dimensions; dims.append([o.name,round(d.x,2),round(d.z,2),round(d.y,2)])
    rep[aid]={'tris':tris,'kb':os.path.getsize(out)//1024,'objs':dims}
    print('DONE',aid,rep[aid]['tris'],rep[aid]['kb'],'KB',dims[:4],flush=True)
json.dump(rep,open(O+'/report'+('_'+'_'.join(only) if only else '')+'.json','w'))
