// Principal.jsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, FlatList } from 'react-native';
import { CheckBox } from '@rneui/themed'; // Importa CheckBox de @rneui/themed
import axios from 'axios';

export default function Principal() {
  const [comidas, setComidas] = useState([]);
  const [selectedComida, setSelectedComida] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({}); // Estado para mantener las variantes seleccionadas

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
});
