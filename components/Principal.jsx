// Principal.jsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, FlatList } from 'react-native';
import { CheckBox } from '@rneui/themed'; // Importa CheckBox de @rneui/themed
import axios from 'axios';
import { Modal, TextInput, TouchableOpacity } from 'react-native';


export default function Principal() {
  const [comidas, setComidas] = useState([]);
  const [selectedComida, setSelectedComida] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({}); // Estado para mantener las variantes seleccionadas
  const [modalVisible, setModalVisible] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ cantidad: '', ingrediente: '', variantes: [''] });





  useEffect(() => {
    // Fetch the data from the provided URL
    axios.get('https://iiiproyectodisenio-default-rtdb.firebaseio.com/Comidas.json')
      .then(response => {
        const fetchedComidas = [];
        for (const key in response.data) {
          fetchedComidas.push({
            id: key,
            ...response.data[key]
          });
        }
        setComidas(fetchedComidas);
      })
      .catch(error => console.error(error));
  }, []);

  const handlePress = (comida) => {
    setSelectedComida(comida);
  };

  // Función para manejar el cambio de estado de los checkboxes
  const handleCheckboxToggle = (ingredienteKey, varianteKey) => {
    const newSelectedVariants = { ...selectedVariants }; // Crea una copia del estado actual de las variantes seleccionadas
    if (newSelectedVariants[ingredienteKey] === varianteKey) {
      // Si la variante ya estaba seleccionada, la va a deseleccionar
      delete newSelectedVariants[ingredienteKey];
    } else {
      // Si la variante no estaba seleccionada, la va a seleccionar
      newSelectedVariants[ingredienteKey] = varianteKey;
    }
    setSelectedVariants(newSelectedVariants); // Actualiza el estado de las variantes seleccionadas
  };

  const renderInstrucciones = () => {
    if (!selectedComida || !selectedComida.instrucciones) return null;

    const instrucciones = Object.entries(selectedComida.instrucciones)
      .filter(([key, value]) => value.trim() !== '') // Filtrar pasos no vacíos
      .map(([key, value]) => ({
        paso: key,
        texto: value
      }));

    if (instrucciones.length === 0) return null;

    return (
      <View style={styles.instructionsContainer}>
        <Text style={styles.title}>Instrucciones de preparación</Text>
        {instrucciones.map((instr, index) => (
          <Text key={index} style={styles.instructionText}>
            <Text style={styles.instructionTitle}>{instr.paso}: </Text>{instr.texto}
          </Text>
        ))}
      </View>
    );
  };

  const addVariant = () => {
    setNewIngredient({ ...newIngredient, variantes: [...newIngredient.variantes, ''] });
  };

  const removeVariant = (index) => {
    const updatedVariants = [...newIngredient.variantes];
    updatedVariants.splice(index, 1);
    setNewIngredient({ ...newIngredient, variantes: updatedVariants });
  };
  const handleVariantChange = (index, value) => {
    const updatedVariants = [...newIngredient.variantes];
    updatedVariants[index] = value;
    setNewIngredient({ ...newIngredient, variantes: updatedVariants });
  };
  const handleInputChange = (name, value) => {
    setNewIngredient({ ...newIngredient, [name]: value });
  };  this

  const handleAddIngredient = () => {
    if (selectedComida) {
      const newKey = `ingrediente${Object.keys(selectedComida).filter(key => key.startsWith('ingrediente')).length + 1}`;
      const updatedComida = {
        ...selectedComida,
        [newKey]: { ...newIngredient.variantes.reduce((acc, curr, idx) => ({ ...acc, [`variante${idx + 1}`]: curr }), {}) },
        [`cantidad${Object.keys(selectedComida).filter(key => key.startsWith('ingrediente')).length + 1}`]: newIngredient.cantidad,
      };
      setSelectedComida(updatedComida);
      setComidas(comidas.map(comida => comida.id === selectedComida.id ? updatedComida : comida));
      setModalVisible(false);
      setNewIngredient({ cantidad: '', ingrediente: '', variantes: [''] });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {selectedComida ? (
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{selectedComida.nombreComida}</Text>
          {selectedComida.image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedComida.image }} style={styles.image} />
            </View>
          )}
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Cantidad</Text>
            <Text style={styles.headerText}>Ingredientes</Text>
          </View>
          {Object.keys(selectedComida)
            .filter(key => key.startsWith('ingrediente'))
            .sort((a, b) => a.localeCompare(b))
            .map((key, index) => {
              const variantes = Object.keys(selectedComida[key])
                .filter(subKey => subKey.startsWith('variante'))
                .map((subKey, subIndex) => {
                  const variante = selectedComida[key][subKey];
                  if (variante && variante.trim() !== '') { // Verifica si la variante no está en blanco
                    return (
                      <View key={subIndex} style={styles.variantContainer}>
                        <CheckBox
                          checked={selectedVariants[key] === subKey} // Comprueba si esta variante está seleccionada
                          onPress={() => handleCheckboxToggle(key, subKey)} // Maneja el cambio de estado
                        />
                        <Text style={[styles.variantText, styles.blueText]}>
                          {variante}
                        </Text>
                      </View>
                    );
                  } else {
                    return null; // No renderiza el checkbox si la variante está en blanco
                  }
                });

              // Renderizar solo si hay variantes disponibles
              return variantes.length > 0 ? (
                <View key={index} style={styles.ingredientContainer}>
                  <Text style={styles.ingredientText}>{selectedComida['cantidad' + key.slice(11)]}</Text>
                  <View style={styles.variantColumn}>{variantes}</View>
                </View>
              ) : null;
            })}
          {renderInstrucciones()}
          <Text style={styles.button} onPress={() => setSelectedComida(null)}>Volver</Text>
          <Text style={styles.button} onPress={() => setModalVisible(true)}>Agregar Ingrediente</Text>

        </View>
      ) : (
        <FlatList
          data={comidas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text style={styles.item} onPress={() => handlePress(item)}>{item.nombreComida}</Text>
          )}
        />
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Ingrediente</Text>
            <TextInput
              style={styles.input}
              placeholder="Cantidad"
              value={newIngredient.cantidad}
              onChangeText={(text) => handleInputChange('cantidad', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Ingrediente"
              value={newIngredient.ingrediente}
              onChangeText={(text) => handleInputChange('ingrediente', text)}
            />
            {newIngredient.variantes.map((variante, index) => (
              <View key={index} style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Variante"
                  value={variante}
                  onChangeText={(text) => handleVariantChange(index, text)}
                />
                {index > 0 && (
                  <TouchableOpacity onPress={() => removeVariant(index)} style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity onPress={addVariant} style={styles.addButton}>
              <Text style={styles.buttonText}>Agregar Variante</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleAddIngredient}>
              <Text style={styles.buttonText}>Agregar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  item: {
    fontSize: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
  },
  detailsContainer: {
    padding: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginLeft: 30,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  ingredientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Justifica el espacio entre los elementos
    marginBottom: 2,
    width: '100%', // Ocupa todo el ancho disponible
    borderBottomWidth: 1, // Añade una línea separadora
    borderBottomColor: '#ccc',
    paddingVertical: 10,
  },
  ingredientText: {
    marginLeft: 30,
    alignItems: 'center',
    justifyContent: 'center', // Centra los elementos horizontalmente
    marginBottom: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between', // Justifica el espacio entre los elementos del encabezado
    width: '100%', // Ocupa todo el ancho disponible
    borderBottomWidth: 2, // Línea separadora para el encabezado
    borderBottomColor: '#007BFF',
    paddingBottom: 5,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#007BFF',
    flex: 1,
    textAlign: 'justificy',
    marginLeft: 30,
  },
  variantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'justificy', // Centra los elementos horizontalmente
    marginBottom: 1,
    marginLeft: 70,
  },
  variantText: {
    marginLeft: -15,
    alignItems: 'justificy',
  },
  blueText: {
    color: '#007BFF',
  },
  variantColumn: {
    flex: 1,
    alignItems: 'justificy', // Centra los elementos dentro de la columna

  },
  instructionsContainer: {
    marginTop: 20,
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 5,
  },
  instructionTitle: {
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeButton: {
    marginLeft: 10,
  },
  removeButtonText: {
    color: 'red',
  },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
});
