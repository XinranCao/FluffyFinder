import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Swiper from "react-native-swiper";

const ImageSwiper = ({ images }) => {
  return (
    <Swiper
      autoplay={false}
      loop={false}
      activeDotColor="#3D7D6C"
      dotColor="#eee"
    >
      {images.length ? (
        images.map((image, index) => (
          <View key={index} style={styles.slide}>
            <Image source={image} style={styles.image} />
          </View>
        ))
      ) : (
        <View style={styles.slide}>
          <Image
            source={require("../../assets/lost_pets.png")}
            style={styles.image}
          />
        </View>
      )}
    </Swiper>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#9DD6EB",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default ImageSwiper;
