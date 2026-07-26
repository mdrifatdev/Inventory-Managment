import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Text, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon } from 'lucide-react-native';

interface Props {
  onImageSelected: (uri: string) => void;
  currentImage?: string;
}

export default function AppImagePicker({ onImageSelected, currentImage }: Props) {
  const [image, setImage] = useState<string | null>(currentImage || null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your gallery to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      onImageSelected(uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your camera to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      onImageSelected(uri);
    }
  };

  return (
    <View className="items-center">
      {image ? (
        <Image source={{ uri: image }} className="w-full h-48 rounded-xl bg-gray-200" />
      ) : (
        <View className="w-full h-48 rounded-xl bg-gray-100 items-center justify-center border-2 border-dashed border-gray-300">
          <ImageIcon size={40} color="#94a3b8" />
          <Text className="text-gray-400 mt-2 text-xs">No image selected</Text>
        </View>
      )}

      <View className="flex-row gap-4 w-full mt-4">
        <TouchableOpacity
          onPress={takePhoto}
          className="flex-1 bg-brand flex-row items-center justify-center py-3 rounded-lg"
        >
          <Camera size={18} color="white" />
          <Text className="text-white font-bold ml-2 text-xs">Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={pickImage}
          className="flex-1 bg-white border border-brand flex-row items-center justify-center py-3 rounded-lg"
        >
          <ImageIcon size={18} color="#3b82f6" />
          <Text className="text-brand font-bold ml-2 text-xs">Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
