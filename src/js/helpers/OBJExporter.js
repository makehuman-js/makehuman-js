/**
 * from three.js
 */
import * as THREE from 'three'
import _ from 'lodash'

export const OBJExporter = function () {}
// TODO add metadata
// TODO add groups
OBJExporter.prototype = {

    constructor: OBJExporter,

    parse(object) {
        let output = ''
        const precision = 4

        let indexVertex = 0
        let indexVertexUvs = 0
        let indexNormals = 0

        let i,
            j,
            k,
            l,
            m,
            group,
            face = []

        const parseMesh = function (mesh) {
            const nbVertex = 0
            const nbNormals = 0
            const nbVertexUvs = 0

            let geometry = mesh.geometry
            let faceGroups,
                groupNames

            if (geometry instanceof THREE.Geometry) {
                faceGroups = geometry.faces.map(f => f.materialIndex)
                groupNames = mesh.material.materials.map(m => m.name)

                // shortcuts
                const vertices = mesh.geometry.vertices
                // const normals = geometry.getAttribute('normal')
                const uvs = mesh.geometry.faceVertexUvs[0]
                const faces = mesh.geometry.faces

                // name of the mesh object
                output += `o ${mesh.name}\n`

                // name of the mesh material
                if (mesh.material && mesh.material.name) {
                    output += `usemtl ${mesh.material.name}\n`
                }

                // vertices

                if (vertices !== undefined) {
                    for (let ii = 0; ii < vertices.length; ii++) {
                        const vertex = vertices[ii]

                        // transfrom the vertex to world space
                        vertex.applyMatrix4(mesh.matrixWorld)

                        // transform the vertex to export format
                        output += `v ${_.round(vertex.x, precision)} ${_.round(vertex.y, precision)} ${_.round(vertex.z, precision)}\n`
                    }
                }

                // uvs

                if (uvs !== undefined) {
                    for (let ii = 0; ii < uvs.length; ii++) {
                        for (let jj = 0; jj < uvs[ii].length; jj++) {
                            const uv = uvs[ii][jj]
                            // transform the uv to export format
                            output += `vt ${_.round(uv.x, precision)} ${_.round(uv.y, precision)}\n`
                        }
                    }
                }

                // normals

                // if (normals !== undefined) {
                //
                //     normalMatrixWorld.getNormalMatrix(mesh.matrixWorld);
                //
                //     for (i = 0, l = normals.count; i < l; i++, nbNormals++) {
                //
                //         normal.x = normals.getX(i);
                //         normal.y = normals.getY(i);
                //         normal.z = normals.getZ(i);
                //
                //         // transfrom the normal to world space
                //         normal.applyMatrix3(normalMatrixWorld);
                //
                //         // transform the normal to export format
                //         output += 'vn ' + _.round(normal.x, precision) + ' ' + _.round(normal.y, precision) + ' ' + _.round(normal.z, precision) + '\n';
                //
                //     }
                //
                // }

                for (let ii = 0; ii < faces.length; ii++) {
                    face = faces[ii]

                    // convert from materialIndex to facegroup
                    if (faceGroups && faceGroups[ii] !== group) {
                        group = faceGroups[ii]
                        output += `g ${groupNames[group]}\n`
                    }

                    // transform the face to export format
                    output += `f ${face.a + 1}/${ii * 3 + 1} ${face.b + 1}/${ii * 3 + 2} ${face.c + 1}/${ii * 3 + 3}\n`
                }
            } else {
                console.warn('THREE.OBJExporter.parseMesh(): geometry type unsupported', geometry)
            }

            // update index
            indexVertex += nbVertex
            indexVertexUvs += nbVertexUvs
            indexNormals += nbNormals
        }

        const parseLine = function (line) {
            let nbVertex = 0

            let geometry = line.geometry
            const type = line.type

            if (geometry instanceof THREE.Geometry) {
                geometry = new THREE.BufferGeometry().setFromObject(line)
            }

            if (geometry instanceof THREE.BufferGeometry) {
                // shortcuts
                const vertices = geometry.getAttribute('position')
                const indices = geometry.getIndex()

                // name of the line object
                output += `o ${line.name}\n`

                if (vertices !== undefined) {
                    for (i = 0, l = vertices.count; i < l; i++, nbVertex++) {
                        vertex.x = vertices.getX(i)
                        vertex.y = vertices.getY(i)
                        vertex.z = vertices.getZ(i)

                        // transfrom the vertex to world space
                        vertex.applyMatrix4(line.matrixWorld)

                        // transform the vertex to export format
                        output += `v ${vertex.x} ${vertex.y} ${vertex.z}\n`
                    }
                }

                if (type === 'Line') {
                    output += 'l '

                    for (j = 1, l = vertices.count; j <= l; j++) {
                        output += `${indexVertex + j} `
                    }

                    output += '\n'
                }

                if (type === 'LineSegments') {
                    for (j = 1, k = j + 1, l = vertices.count; j < l; j += 2, k = j + 1) {
                        output += `l ${indexVertex + j} ${indexVertex + k}\n`
                    }
                }
            } else {
                console.warn('THREE.OBJExporter.parseLine(): geometry type unsupported', geometry)
            }

            // update index
            indexVertex += nbVertex
        }

        object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                parseMesh(child)
            }

            if (child instanceof THREE.Line) {
                parseLine(child)
            }
        })

        return output
    }

}
export default OBJExporter


//
//
// export var OBJExporter = function() {};
// // TODO add metadata
// // TODO add groups
// OBJExporter.prototype = {
//
//     constructor: OBJExporter,
//
//     parse: function(object) {
//
//         var output = '';
//         var precision = 4;
//
//         var indexVertex = 0;
//         var indexVertexUvs = 0;
//         var indexNormals = 0;
//
//         var vertex = new THREE.Vector3();
//         var normal = new THREE.Vector3();
//         var uv = new THREE.Vector2();
//
//         var i,
//             j,
//             k,
//             l,
//             m,
//             group,
//             face = [];
//
//         var parseMesh = function(mesh) {
//
//             var nbVertex = 0;
//             var nbNormals = 0;
//             var nbVertexUvs = 0;
//
//             var geometry = mesh.geometry;
//
//             var normalMatrixWorld = new THREE.Matrix3();
//             let faceGroups, groupNames
//
//             if (geometry instanceof THREE.Geometry) {
//                 faceGroups = geometry.faces.map(f=>f.materialIndex)
//                 groupNames = mesh.material.materials.map(m=>m.name)
//                     // .filter(name=>name.startsWith('joint') || name.startsWith('helper'))
//                 geometry = new THREE.BufferGeometry().setFromObject(mesh);
//             }
//
//             if (geometry instanceof THREE.BufferGeometry) {
//
//                 // shortcuts
//                 var vertices = geometry.getAttribute('position');
//                 var normals = geometry.getAttribute('normal');
//                 var uvs = geometry.getAttribute('uv');
//                 var indices = geometry.getIndex();
//
//                 // name of the mesh object
//                 output += 'o ' + mesh.name + '\n';
//
//                 // name of the mesh material
//                 if (mesh.material && mesh.material.name) {
//                     output += 'usemtl ' + mesh.material.name + '\n';
//                 }
//
//                 // vertices
//
//                 if (vertices !== undefined) {
//
//                     for (i = 0, l = vertices.count; i < l; i++, nbVertex++) {
//
//                         vertex.x = vertices.getX(i);
//                         vertex.y = vertices.getY(i);
//                         vertex.z = vertices.getZ(i);
//
//                         // transfrom the vertex to world space
//                         vertex.applyMatrix4(mesh.matrixWorld);
//
//                         // transform the vertex to export format
//                         output += 'v ' + _.round(vertex.x, precision) + ' ' + _.round(vertex.y, precision) + ' ' + _.round(vertex.z, precision) + '\n';
//
//                     }
//
//                 }
//
//                 // uvs
//
//                 if (uvs !== undefined) {
//
//                     for (i = 0, l = uvs.count; i < l; i++, nbVertexUvs++) {
//
//                         uv.x = uvs.getX(i);
//                         uv.y = uvs.getY(i);
//
//                         // transform the uv to export format
//                         output += 'vt ' + _.round(uv.x, precision) + ' ' + _.round(uv.y, precision) + '\n';
//
//                     }
//
//                 }
//
//                 // normals
//
//                 if (normals !== undefined) {
//
//                     normalMatrixWorld.getNormalMatrix(mesh.matrixWorld);
//
//                     for (i = 0, l = normals.count; i < l; i++, nbNormals++) {
//
//                         normal.x = normals.getX(i);
//                         normal.y = normals.getY(i);
//                         normal.z = normals.getZ(i);
//
//                         // transfrom the normal to world space
//                         normal.applyMatrix3(normalMatrixWorld);
//
//                         // transform the normal to export format
//                         output += 'vn ' + _.round(normal.x, precision) + ' ' + _.round(normal.y, precision) + ' ' + _.round(normal.z, precision) + '\n';
//
//                     }
//
//                 }
//
//                 if (indices !== null) {
//
//                     for (i = 0, l = indices.count; i < l; i += 3) {
//
//                         // convert from materialIndex to facegroup
//                         if (faceGroups && faceGroups[i/3] !== group) {
//                             group = faceGroups[i/3]
//                             output += 'g '+ groupNames[group]+"\n"
//                         }
//
//                         for (m = 0; m < 3; m++) {
//
//                             j = indices.getX(i + m) + 1;
//
//
//                             face[m] = (indexVertex + j) + '/' + (uvs
//                                 ? (indexVertexUvs + j)
//                                 : '') + '/' + (indexNormals + j);
//
//                         }
//
//                         // transform the face to export format
//                         output += 'f ' + face.join(' ') + "\n";
//
//                     }
//
//                 } else {
//
//                     let faces = []
//
//                     for (i = 0, l = vertices.count; i < l; i += 3) {
//
//                         // convert from materialIndex to facegroup
//                         if (faceGroups && faceGroups[i/3] !== group) {
//                             group = faceGroups[i/3]
//                             output += 'g '+ groupNames[group]+"\n"
//                         }
//
//                         for (m = 0; m < 3; m++) {
//
//                             j = i + m + 1;
//
//
//                             face[m] = (indexVertex + j) + '/' + (uvs
//                                 ? (indexVertexUvs + j)
//                                 : '') + '/' + (indexNormals + j);
//
//                         }
//
//                         // transform the face to export format
//                         output += 'f ' + face.join(' ') + "\n";
//
//                     }
//
//                 }
//
//             } else {
//
//                 console.warn('THREE.OBJExporter.parseMesh(): geometry type unsupported', geometry);
//
//             }
//
//             // update index
//             indexVertex += nbVertex;
//             indexVertexUvs += nbVertexUvs;
//             indexNormals += nbNormals;
//
//         };
//
//         var parseLine = function(line) {
//
//             var nbVertex = 0;
//
//             var geometry = line.geometry;
//             var type = line.type;
//
//             if (geometry instanceof THREE.Geometry) {
//
//                 geometry = new THREE.BufferGeometry().setFromObject(line);
//
//             }
//
//             if (geometry instanceof THREE.BufferGeometry) {
//
//                 // shortcuts
//                 var vertices = geometry.getAttribute('position');
//                 var indices = geometry.getIndex();
//
//                 // name of the line object
//                 output += 'o ' + line.name + '\n';
//
//                 if (vertices !== undefined) {
//
//                     for (i = 0, l = vertices.count; i < l; i++, nbVertex++) {
//
//                         vertex.x = vertices.getX(i);
//                         vertex.y = vertices.getY(i);
//                         vertex.z = vertices.getZ(i);
//
//                         // transfrom the vertex to world space
//                         vertex.applyMatrix4(line.matrixWorld);
//
//                         // transform the vertex to export format
//                         output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n';
//
//                     }
//
//                 }
//
//                 if (type === 'Line') {
//
//                     output += 'l ';
//
//                     for (j = 1, l = vertices.count; j <= l; j++) {
//
//                         output += (indexVertex + j) + ' ';
//
//                     }
//
//                     output += '\n';
//
//                 }
//
//                 if (type === 'LineSegments') {
//
//                     for (j = 1, k = j + 1, l = vertices.count; j < l; j += 2, k = j + 1) {
//
//                         output += 'l ' + (indexVertex + j) + ' ' + (indexVertex + k) + '\n';
//
//                     }
//
//                 }
//
//             } else {
//
//                 console.warn('THREE.OBJExporter.parseLine(): geometry type unsupported', geometry);
//
//             }
//
//             // update index
//             indexVertex += nbVertex;
//
//         };
//
//         object.traverse(function(child) {
//
//             if (child instanceof THREE.Mesh) {
//                 parseMesh(child);
//             }
//
//             if (child instanceof THREE.Line) {
//
//                 parseLine(child);
//
//             }
//
//         });
//
//         return output;
//
//     }
//
// };
