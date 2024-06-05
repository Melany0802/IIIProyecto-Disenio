import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import axios from 'axios';
import { CheckBox } from '@rneui/themed';

export default function Principal() {
  const [comidas, setComidas] = useState([]);
  const [selectedComida, setSelectedComida] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [totalPriceModalVisible, setTotalPriceModalVisible] = useState(false);  // Nuevo estado
  const [newIngredient, setNewIngredient] = useState({ cantidad: '', ingrediente: '', variantes: [''] });
  const [extraInstruction, setExtraInstruction] = useState('');
  const [showExtraInstructionInput, setShowExtraInstructionInput] = useState(false);
  const [restriccionDietetica, setRestriccionDietetica] = useState('');
  const [showRestriccionInput, setShowRestriccionInput] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);  // Nuevo estado

  useEffect(() => {
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

  const handleCheckboxToggle = (ingredienteKey, varianteKey) => {
    const newSelectedVariants = { ...selectedVariants };
    if (newSelectedVariants[ingredienteKey] === varianteKey) {
      delete newSelectedVariants[ingredienteKey];
    } else {
      newSelectedVariants[ingredienteKey] = varianteKey;
    }
    setSelectedVariants(newSelectedVariants);
  };

  const calculateTotalPrice = () => {
    let total = 0;
    for (const key in selectedVariants) {
      const precio = selectedComida[`precioV${selectedVariants[key].slice(8)}`];
      if (precio) {
        total += parseFloat(precio);
      }
    }
    setTotalPrice(total);
    setTotalPriceModalVisible(true);  // Mostrar el modal del precio total
  };

  const renderInstrucciones = () => {
    if (!selectedComida || (!selectedComida.instrucciones && !selectedComida.instruccionExtra && !selectedComida.restriccionDietetica)) return null;
    const instrucciones = Object.entries(selectedComida.instrucciones || {})
      .filter(([key, value]) => value.trim() !== '')
      .map(([key, value]) => ({
        paso: key,
        texto: value
      }));

    return (
      <View>
        <Text style={styles.title}>Instrucciones de preparación</Text>
        {instrucciones.map((instr, index) => (
          <Text key={index} style={styles.instructionText}>
            <Text style={styles.instructionTitle}>{instr.paso}: </Text>{instr.texto}
          </Text>
        ))}
        {selectedComida.instruccionExtra && (
          <Text style={styles.title}>Mi instrucción: {selectedComida.instruccionExtra}</Text>
        )}
        {selectedComida.restriccionDietetica && (
          <Text style={styles.title}>Mi Restricción Dietética: {selectedComida.restriccionDietetica}</Text>
        )}
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
  };

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

  const handleAddExtraInstruction = () => {
    if (selectedComida) {
      // Actualizar el estado local
      setSelectedComida(prevState => ({ ...prevState, instruccionExtra: extraInstruction }));
      // Enviar la actualización al servidor
      axios.patch(`https://iiiproyectodisenio-default-rtdb.firebaseio.com/Comidas/${selectedComida.id}.json`, { instruccionExtra: extraInstruction })
        .then(response => console.log('Instrucción extra agregada correctamente'))
        .catch(error => console.error('Error al agregar instrucción extra:', error));
      setShowExtraInstructionInput(false);
      setExtraInstruction('');
    }
  };

  const handleAddRestriccion = () => {
    if (selectedComida) {
      // Actualizar el estado local
      setSelectedComida(prevState => ({ ...prevState, restriccionDietetica }));
      // Enviar la actualización al servidor
      axios.patch(`https://iiiproyectodisenio-default-rtdb.firebaseio.com/Comidas/${selectedComida.id}.json`, { restriccionDietetica })
        .then(response => console.log('Restricción dietética agregada correctamente'))
        .catch(error => console.error('Error al agregar restricción dietética:', error));
      setShowRestriccionInput(false);
      setRestriccionDietetica('');
    }
  };

  const renderSection = (title, items) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
            <Image source={{ uri: item.image || '/placeholder.svg' }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.nombreComida}</Text>
            </View>
          </TouchableOpacity>
        )}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );

  const categorizedComidas = comidas.reduce((acc, comida) => {
    const category = comida.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(comida);
    return acc;
  }, {});

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {selectedComida ? (
        <View>
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
              <Text style={styles.headerText}>Precio</Text>
            </View>
            <View style={styles.separator} />
            {Object.keys(selectedComida)
              .filter(key => key.startsWith('ingrediente'))
              .sort((a, b) => a.localeCompare(b))
              .map((key, index) => {
                const variantes = Object.keys(selectedComida[key])
                  .filter(subKey => subKey.startsWith('variante'))
                  .map((subKey, subIndex) => {
                    const variante = selectedComida[key][subKey];
                    const precioVariante = selectedComida[`precioV${subKey.slice(8)}`];
                    if (variante && variante.trim() !== '') {
                      const precio = precioVariante ? `$${precioVariante}` : '';
                      return (
                        <View key={subIndex} style={styles.variantContainer}>
                          <CheckBox
                            checked={selectedVariants[key] === subKey}
                            onPress={() => handleCheckboxToggle(key, subKey, precioVariante)}
                          />
                          <Text style={styles.variantText}>{variante}</Text>
                          <Text style={styles.variantPrice}>{precio}</Text>
                        </View>
                      );
                    } else {
                      return null;
                    }
                  });

                return variantes.length > 0 ? (
                  <View key={index} style={styles.ingredientContainer}>
                    <Text style={styles.ingredientText}>{selectedComida['cantidad' + key.slice(11)]}</Text>
                    <View style={styles.variantColumn}>{variantes}</View>
                  </View>
                ) : null;
              })}
            <Text style={styles.button} onPress={() => setSelectedComida(null)}>Volver</Text>
            <Text style={styles.button} onPress={() => setModalVisible(true)}>Agregar Ingrediente</Text>
            <Text style={styles.button} onPress={calculateTotalPrice}>Pedir</Text>
          </View>

          <View style={styles.detailsContainerInstructions}>
            {renderInstrucciones()}
            <TouchableOpacity onPress={() => setShowExtraInstructionInput(true)} style={styles.addButton}>
              <Text style={styles.buttonText}>Agregar Instrucción Adicional</Text>
            </TouchableOpacity>
            {showExtraInstructionInput && (
              <TextInput
                style={styles.input}
                placeholder="Instrucción Adicional"
                value={extraInstruction}
                onChangeText={(text) => setExtraInstruction(text)}
              />
            )}
            {showExtraInstructionInput && (
              <TouchableOpacity style={styles.modalButton} onPress={handleAddExtraInstruction}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setShowRestriccionInput(true)} style={styles.addButton}>
              <Text style={styles.buttonText}>Agregar Restricción Dietética</Text>
            </TouchableOpacity>
            {showRestriccionInput && (
              <TextInput
                style={styles.input}
                placeholder="Restricción Dietética"
                value={restriccionDietetica}
                onChangeText={(text) => setRestriccionDietetica(text)}
              />
            )}
            {showRestriccionInput && (
              <TouchableOpacity style={styles.modalButton} onPress={handleAddRestriccion}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View>
          {['Pastas', 'Arroces', 'Puré', 'Sopas', 'Ensaladas'].map(category => (
            <View key={category}>
              {categorizedComidas[category] && renderSection(category, categorizedComidas[category])}
            </View>
          ))}
        </View>
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
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={totalPriceModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Total del Pedido</Text>  
            <Text style={styles.modalText}>Total Price: ${totalPrice.toFixed(2)}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setTotalPriceModalVisible(false)}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
            

          </View>
        </View>
      </Modal>
    </ScrollView>
  );

}


const styles = StyleSheet.create({
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  container: {
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginRight: 10,
    overflow: 'hidden',
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  cardImage: {
    height: 100,
    width: '100%',
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },

  detailsContainerInstructions: {
    padding: 20,
    marginTop: 20,

    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '',
    marginBottom: 20,

  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 16,

  },
  ingredientContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  ingredientText: {
    fontSize: 16,
    flex: 1,
  },
  variantColumn: {
    flex: 2,
  },
  variantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -50,
  },

  variantText: {
    fontSize: 16,
    marginLeft: -10,
  },

  blueText: {
    color: 'blue',
  },
  instructionsContainer: {
    marginTop: 20,
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 10,
  },
  instructionTitle: {
    fontWeight: 'bold',

  },
  button: {
    color: 'blue',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 'auto',
    color: 'green',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    marginLeft: 10,
    backgroundColor: 'red',
    padding: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
  },
  addButton: { //botón de AgregarInstruccion
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { //Texto de agregarIntrucción
    color: '#fff',
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  separator: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginVertical: 10,
  },
});
