import { StyleSheet, TextInput, View } from "react-native";
import { TextInput as TextInput2, TextInputProps } from "react-native-paper";
export interface CustomInputProps extends TextInputProps {
  left?: React.ReactElement;
  right?: React.ReactElement;
  textArea?: boolean;
}
export const CustomInput = ({
  left,
  right,
  textArea = false,
  ...props
}: CustomInputProps) => (
  <TextInput2
    multiline={textArea}
    numberOfLines={textArea ? 4 : 1}
    theme={{
      roundness: 0,
      colors: {
        background: "#ffffff",
      },
    }}
    {...props}
    render={inputProps => (
      <View style={styles.inputContainer}>
        {left && <View style={styles.customLeft}>{left}</View>}
        <TextInput
          {...inputProps}
          style={[inputProps.style, { flex: 1, color: "#111111" }]}
        />
        {right && <View style={styles.customRight}>{right}</View>}
      </View>
    )}
  />
);
const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
  },
  customLeft: {
    position: "absolute",
    left: 0,
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  customRight: {
    position: "absolute",
    right: 0,
    marginVertical: 15,
    paddingHorizontal: 10,
  },
});
