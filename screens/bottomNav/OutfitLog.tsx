import {
  Text,
  View,
  Pressable,
  StyleSheet,
  Keyboard,
  FlatList,
} from "react-native";
import { ThemeView } from "../../components/ThemeView";
import React, { useEffect, useState, useMemo } from "react";
// replaced FlashList with FlatList from react-native
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { LogComponent } from "../../components/LogComponent";
import { RadioButton, Searchbar } from "react-native-paper";
import Icon from "react-native-vector-icons/FontAwesome";
import CustomModal from "../../components/CustomModal";
import { logsType } from "../../redux/itemsSlice";
import { ThemeText } from "../../components/ThemeText";
import dayjs from "dayjs";
import { colors } from "../../utils/colors";
import { SideModal } from "../../components/SideModal";
import { LogFilter } from "../../utils/filters";
import { localization } from "../../utils/localization";
export const OutfitLog = () => {
  const [search, setSearch] = useState("");
  const isDarkMode = false;
  const logsState = useSelector((state: RootState) => state.itemsList.logs);
  const [refresh, setRefresh] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEventId, setModalEventId] = useState("");
  const [modalInfo, setModalInfo] = useState<logsType>();
  const [sortValue, setSortValue] = useState("LA");
  const [isOpen, setIsOpen] = useState(false);
  const handleOpenDrawer = () => {
    // Open or close the filter panel.
    Keyboard.dismiss();
    setIsOpen(prev => !prev);
  };
  useEffect(() => {
    let info = logsState.find(x => x.eventId == modalEventId);
    setModalInfo(info);
  }, [modalEventId, logsState]);
  const filteredLogs = useMemo(() => {
    return LogFilter(sortValue, logsState, search);
  }, [logsState, search, sortValue]);
  const storedSettings = useSelector((state: RootState) => state.settings);
  return (
    <ThemeView customStyle={[{ paddingHorizontal: 4 }]}>
      <CustomModal
        setVisible={setModalVisible}
        visible={modalVisible}
        label={modalInfo?.eventName || "Event Name"}
      >
        <View
          style={[{ width: "90%", marginRight: "auto", marginLeft: "auto" }]}
        >
          <View style={[{ marginTop: 20, padding: 20 }]}>
            <ThemeText customStyle={styles.dayStyle}>
              {dayjs(
                modalInfo?.eventDate ? JSON.parse(modalInfo?.eventDate) : "",
              ).format("dddd")}
            </ThemeText>
            <ThemeText customStyle={styles.date}>
              {dayjs(
                modalInfo?.eventDate ? JSON.parse(modalInfo?.eventDate) : "",
              ).format("MMM DD, YYYY")}
            </ThemeText>
            <View
              style={[[{ width: "60%", height: 1 }, isDarkMode ? {} : {}, {}]]}
            />
            <View style={[{ flexDirection: "row", marginTop: 8 }]}>
              {/* <ThemeText classNameStyle="text-[16px]">Time:</ThemeText> */}
              <ThemeText customStyle={styles.timeStyle}>
                {dayjs(
                  modalInfo?.eventDate ? JSON.parse(modalInfo?.eventDate) : "",
                ).format("h:mm ")}
              </ThemeText>
              <ThemeText customStyle={styles.timeA}>
                {dayjs(
                  modalInfo?.eventDate ? JSON.parse(modalInfo?.eventDate) : "",
                ).format("A")}
              </ThemeText>
            </View>
          </View>

          {modalInfo?.additionalNotes && (
            <View style={[{ padding: 8 }]}>
              <ThemeText customStyle={styles.notes}>
                {localization.Additional_notes[storedSettings.language]}
              </ThemeText>
              <ThemeText customStyle={[{}]}>
                {modalInfo?.additionalNotes}
              </ThemeText>
            </View>
          )}
        </View>
      </CustomModal>
      <SideModal isOpen={isOpen} setIsOpen={setIsOpen}>
        <>
          <RadioButton.Group
            onValueChange={value => setSortValue(value)}
            value={sortValue}
          >
            <RadioButton.Item
              label={localization.Last_Added[storedSettings.language]}
              value="LA"
              color="#111111"
              labelStyle={{ fontSize: 14 }}
            />
            <RadioButton.Item
              label={localization.Name_Asc[storedSettings.language]}
              value="NA"
              color="#111111"
              labelStyle={{ fontSize: 14 }}
            />
            <RadioButton.Item
              label={localization.Name_Desc[storedSettings.language]}
              value="ND"
              color="#111111"
              labelStyle={{ fontSize: 14 }}
            />
            <RadioButton.Item
              label={localization.Date_Asc[storedSettings.language]}
              value="DA"
              color="#111111"
              labelStyle={{ fontSize: 14 }}
            />
            <RadioButton.Item
              label={localization.Date_Desc[storedSettings.language]}
              value="DD"
              color="#111111"
              labelStyle={{ fontSize: 14 }}
            />
          </RadioButton.Group>
        </>
      </SideModal>
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: 56,
            marginBottom: "1%",
          },
        ]}
      >
        <Text style={[{}]}>{localization.Logs[storedSettings.language]}</Text>
        <View
          style={[
            { width: "1%", height: "100%", position: "absolute", right: "15%" },
          ]}
        />
        <Pressable
          onPress={() => {
            handleOpenDrawer();
          }}
          style={[
            {
              width: "15%",
              height: "100%",
              position: "absolute",
              right: 0,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Icon name="filter" size={25} color="#111111" />
        </Pressable>
      </View>
      <Searchbar
        theme={{
          roundness: 0,
          colors: {
            onSurfaceVariant: isDarkMode ? colors.white : colors.black,
          },
        }}
        value={search}
        inputStyle={{
          textAlign: "left",
        }}
        // label="Search"
        onChange={text => setSearch(text.nativeEvent.text)}
        onClearIconPress={() => setSearch("")}
        style={[
          { width: "100%" },
          {
            flexDirection: "row",
          },
        ]}
      />
      <View
        style={[
          { marginHorizontal: "auto", marginTop: "1%", paddingHorizontal: 20 },
          {
            width: "100%",
            flex: 1,
          },
        ]}
      >
        {logsState.length <= 0 && (
          <View
            style={[
              {
                flexDirection: "column",
                width: "100%",
                justifyContent: "center",
              },
            ]}
          >
            <ThemeText customStyle={[{ alignSelf: "center" }]}>
              {localization.ClosetHistoryEmpty[storedSettings.language]}
            </ThemeText>
          </View>
        )}
        <FlatList
          showsVerticalScrollIndicator={false}
          data={filteredLogs}
          extraData={refresh}
          renderItem={({ item }) => (
            <LogComponent
              eventName={item.eventName}
              eventDate={JSON.parse(item.eventDate)}
              eventId={item.eventId}
              setRefresh={setRefresh}
              setModalVisible={setModalVisible}
              setModalEventId={setModalEventId}
            />
          )}
        />
      </View>
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  timeStyle: {
    fontSize: 18,
  },
  timeA: {
    fontSize: 15,
  },
  date: {
    fontSize: 18,
  },
  dayStyle: {
    fontSize: 16,
  },
  notes: {
    fontSize: 20,
  },
});
