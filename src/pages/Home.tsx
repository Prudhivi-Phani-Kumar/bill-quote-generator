import { IonContent, IonPage, IonToggle } from "@ionic/react";
import { useState, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { WhatsappIcon, WhatsappShareButton } from "react-share";
import toast, { Toaster } from "react-hot-toast";
import { Clipboard } from "@capacitor/clipboard";
import { Device } from "@capacitor/device";

import "./Home.css";
import axios from "axios";
import flavour from "../mocks/flavourPricePerKG.json";
import { IFlavourAPIData, IFlavourInfo } from "./interfaces";

const Home: React.FC = () => {
  const baseURL = "https://json-files.s3.ap-south-1.amazonaws.com";

  const [isContentToBeDisplayed, setIsContentToBeDisplayed] = useState(false);
  const [isDevideIdFetched, setIsDevideIdFetched] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [flavourData, setFlavourData] = useState<IFlavourAPIData>({});
  const [flavourInfo, setFlavourInfo] = useState<IFlavourInfo[]>([]);
  const [cakeAccessories, setCakeAccessories] = useState("");

  const { register, setValue, handleSubmit, control } = useForm();

  const flavourTypes = ["Chocolate", "Non Chocolate"];

  const flavourType = useWatch({
    control,
    name: "flavour-type",
    defaultValue: flavourTypes,
  });

  useEffect(() => {
    fetchDeviceID();
    fetchFlavourInfo();
    fetchCakeAccessories();
  }, []);

  useEffect(() => {
    let list: IFlavourInfo[] = [];
    if (Object.keys(flavourData).length > 0 && flavourType.length >= 1) {
      list = [
        ...flavourData?.[flavourTypes?.[0]],
        ...flavourData?.[flavourTypes?.[1]],
      ];
      if (flavourType.length === 1) {
        if (flavourType[0] === flavourTypes[0]) {
          flavourData?.[flavourTypes[1]].forEach((i) => {
            setValue(`isFlavourSelected-${i.flavour}`, false);
          });
          flavourData?.[flavourTypes[0]].forEach((i) => {
            setValue(`isFlavourSelected-${i.flavour}`, true);
          });
        } else {
          flavourData?.[flavourTypes[0]].forEach((i) => {
            setValue(`isFlavourSelected-${i.flavour}`, false);
          });
          flavourData?.[flavourTypes[1]].forEach((i) => {
            setValue(`isFlavourSelected-${i.flavour}`, true);
          });
        }
      } else if (flavourType.length > 1) {
        flavourData?.[flavourTypes[1]].forEach((i) => {
          setValue(`isFlavourSelected-${i.flavour}`, true);
        });
        flavourData?.[flavourTypes[0]].forEach((i) => {
          setValue(`isFlavourSelected-${i.flavour}`, true);
        });
      }
    }
    setFlavourInfo(
      [...new Set(list?.map((o) => JSON.stringify(o)))]
        .map((s) => JSON.parse(s))
        .sort((a, b) => a?.price - b?.price)
    );
  }, [flavourType, flavourData]);

  console.log(flavourInfo, "flacvour info");

  const fetchDeviceID = useCallback(async () => {
    const res = await Device.getId();
    setDeviceId(res.identifier);
    const { data } = await axios.get(`${baseURL}/allowedDeviceIds.json`);
    const allowedDeviceIds = JSON.parse(JSON.stringify(data));
    Object.values(allowedDeviceIds).indexOf(res.identifier) !== -1
      ? setIsContentToBeDisplayed(true)
      : setIsDevideIdFetched(true);
  }, []);

  const fetchFlavourInfo = useCallback(async () => {
    const { data } = await axios.get(`${baseURL}/flavourPricePerKG.json`);
    setFlavourData(data);
  }, []);

  const fetchCakeAccessories = useCallback(async () => {
    const { data } = await axios.get(`${baseURL}/cakeAccessories.json`);
    const cakeAccessoriesData = data.reduce(
      (acc: string, item: string) => (acc = acc + `•${item}\n`),
      ""
    );
    console.log(cakeAccessoriesData);

    setCakeAccessories(`\n \nCAKE ACCESSORIES : \n${cakeAccessoriesData}`);
  }, []);

  const egglessTextWithHomeDeliveryText = `\n \nNote : \n 1. EGGLESS Cake costs an extra ₹60/- per Kg. \n 2. Home Delivery service is available and chargeable based on the distance.`;
  const homeDeliveryText = `\n \nNote : \n Home Delivery service is available and chargeable based on the distance.`;
  const [calcuatedOutput, setCalcuatedOutput] = useState("");
  const [outputTextContent, setOutputTextContent] = useState("");
  const [isEgglessSelected, setIsEgglessSelected] = useState(false);
  const [isCakeAccessoriesToBeDisplayed, setIsCakeAccessoriesToBeDisplayed] =
    useState(true);

  const onSubmit = (data: any) => {
    const flavourDetails = [];
    console.log(data);
    for (let item of flavourInfo) {
      const flavoutInputData: any = {};
      for (let key in data) {
        const flavourcategory = key.split("-");
        if (flavourcategory[1] == item.flavour) {
          flavoutInputData["flavour"] = item.flavour;
          flavoutInputData[flavourcategory[0]] = data[key];
        }
      }
      console.log(flavoutInputData);
      flavourDetails.push(flavoutInputData);
    }
    console.log(flavourDetails, "flavourDetails");
    const selectedFlavours = flavourDetails.filter(
      (flavour) => flavour.isFlavourSelected
    );
    console.log(selectedFlavours, "selectedFlavours");
    calcuateCostPerFlavour(selectedFlavours, data);
    getOutputTextContent(data);
    setTimeout((_) => {
      document.getElementById("quote-form-submit")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  const calcuateCostPerFlavour = (
    flavours: any[],
    inputsForPriceCalc: { novelty: any; isEggless: any; quantity: any }
  ) => {
    const noveltyCost = Number(inputsForPriceCalc.novelty) || 0;
    const egglessPrice = inputsForPriceCalc.isEggless ? 60 : 0;
    const cakeQuantity = Number(inputsForPriceCalc.quantity) || 0;

    console.log(`
      noveltyCost: ₹${noveltyCost}
      egglessPrice: ₹${egglessPrice}
      cakeQuantity: ${cakeQuantity} kg's
    `);

    const flavourWithCalcPrice = flavours.map((item: any) => {
      return `${item.flavour}: ${
        cakeQuantity * Number(item.costPerKg) +
        noveltyCost +
        cakeQuantity * egglessPrice
      }`;
    });

    console.log(flavourWithCalcPrice.toString().replace(/,/g, "\n"));
    setCalcuatedOutput(flavourWithCalcPrice.toString().replace(/,/g, "\n"));
  };

  const getOutputTextContent = (data: any) => {
    const cakeQty = Number(data.quantity) || 0;
    const qty = `${cakeQty} ${cakeQty > 1 ? "kg's" : "kg"}`;
    const cakeModelType = `${
      data.cakeType ? `(${data.cakeType.toUpperCase()})` : ""
    }`;
    console.log(data.isEggless, "data");

    // csont isEggless = data.isEggless
    const category = `${data.isEggless ? `(${"eggless".toUpperCase()})` : ""}`;
    setOutputTextContent(
      `The selected model is possible in ${qty} Minimum ${cakeModelType} \n \nCost for the selected model for ${qty} ${category} \n \n \n`
    );
    setIsEgglessSelected(data.isEggless);
    setIsCakeAccessoriesToBeDisplayed(data.isCakeAccessoriesToBeDisplayed);
  };

  const getFinalOutput = () => {
    if (document.getElementById("result-title")?.innerHTML !== null) {
      const calcPrice = document.getElementById("result-output")
        ?.innerHTML as string;
      const info = document.getElementById("result-title")?.innerHTML as string;
      return { info, calcPrice };
    }
  };

  const copyToClipboard = async () => {
    const info = getFinalOutput()?.info || "";
    const calcPrice = getFinalOutput()?.calcPrice;
    try {
      await Clipboard.write({
        string: info + calcPrice,
      });
      toast.success("Copied to clipboard!", {
        id: "clipboard",
      });
      console.log("Content copied to clipboard");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };
  return (
    <IonPage>
      <IonContent fullscreen className="bg">
        <>
          <Toaster toastOptions={{ duration: 4000, position: "top-right" }} />
          {isContentToBeDisplayed ? (
            <main className="wrapper">
              <div className="title">Pastry Chef quotation:</div>
              <div className="w-full">
                <div className="flavour-type-wrapper">
                  <div>
                    <input
                      key={"Non Chocolate"}
                      {...register(`flavour-type`)}
                      id={`flavourtype-non-chocolate`}
                      type="checkbox"
                      className="inp-chbx"
                      value={"Non Chocolate"}
                      defaultChecked
                    />
                    <label
                      htmlFor={`flavourtype-non-chocolate`}
                      className="chbx-label"
                    >
                      Non Chocolate
                    </label>
                  </div>
                  <div>
                    <input
                      key={"Chocolate"}
                      {...register(`flavour-type`)}
                      id={`flavourtype-chocolate`}
                      type="checkbox"
                      defaultChecked
                      className="inp-chbx"
                      value={"Chocolate"}
                    />
                    <label
                      htmlFor={`flavourtype-chocolate`}
                      className="chbx-label"
                    >
                      Chocolate
                    </label>
                  </div>
                </div>
                <div className="container">
                  <div className="fl">Flavor:</div>
                  <div>Cost Per KG:</div>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                  {flavourInfo.map((info, index) => {
                    return (
                      <div className="container" key={info.flavour + index}>
                        <div className="fl">
                          <input
                            key={info.flavour + index}
                            {...register(`isFlavourSelected-${info.flavour}`)}
                            id={`flavour-checkbox-${index}`}
                            type="checkbox"
                            defaultChecked={info.isChecked}
                            className="inp-chbx"
                          />
                          <label
                            htmlFor={`flavour-checkbox-${index}`}
                            className="chbx-label"
                          >
                            {info.flavour}
                          </label>
                        </div>
                        <input
                          key={`costPerKg-${index}`}
                          className="cost-input-readonly"
                          {...register(`costPerKg-${info.flavour}`)}
                          type={"number"}
                          value={info.price}
                          readOnly
                        />
                      </div>
                    );
                  })}
                  <div className="user-input-wrapper">
                    <input
                      className="qty"
                      {...register("quantity")}
                      type={"number"}
                      step={0.5}
                      placeholder={"Quantity"}
                      min={1}
                    />
                    <input
                      className="novelty"
                      {...register("novelty")}
                      placeholder={"Novelty"}
                      type={"number"}
                    />
                    <div className="eggless">
                      <IonToggle
                        {...register("isEggless")}
                        onIonChange={(e) =>
                          setValue("isEggless", e.detail.checked)
                        }
                        value={""}
                        mode="md"
                      >
                        Eggless:
                      </IonToggle>
                    </div>
                    <select className="cake-type" {...register("cakeType")}>
                      <option value="">--choose an option--</option>
                      <option value="Fondant Cake">Fondant Cake</option>
                      <option value="Semi Fondant Cake">
                        Semi Fondant Cake
                      </option>
                      <option value="Photo Cake">Photo Cake</option>
                      <option value="Pinata Cake">Pinata Cake</option>
                      <option value="Bomb Cake">Bomb Cake</option>
                      <option value="Chocolate Cake">Chocolate Cake</option>
                    </select>
                    <div className="cake-acc-chbx">
                      <input
                        {...register("isCakeAccessoriesToBeDisplayed")}
                        id="cake-accessories"
                        type="checkbox"
                        defaultChecked
                        className="inp-chbx"
                      />
                      <label htmlFor="cake-accessories" className="chbx-label">
                        Display cake accessories
                      </label>
                    </div>
                  </div>

                  <button
                    id="quote-form-submit"
                    className="quote-submit-btn"
                    type="submit"
                  >
                    Submit
                  </button>
                </form>
                {calcuatedOutput.length > 0 ? (
                  <div className="output-container">
                    <div className="share-wrapper">
                      <WhatsappShareButton
                        title=""
                        url={
                          (!isEgglessSelected
                            ? outputTextContent +
                              calcuatedOutput +
                              egglessTextWithHomeDeliveryText
                            : outputTextContent +
                              calcuatedOutput +
                              homeDeliveryText) +
                          (isCakeAccessoriesToBeDisplayed
                            ? cakeAccessories
                            : "")
                        }
                      >
                        <WhatsappIcon size={30} round={true} />
                      </WhatsappShareButton>
                      <svg
                        className="clipboard-img"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        onClick={copyToClipboard}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 
                          00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 
                          2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 
                          0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 
                          12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                        ></path>
                      </svg>
                    </div>
                    <div className="result-data">
                      <div id="result-title">{outputTextContent}</div>
                      <div id="result-output">
                        {calcuatedOutput}
                        {!isEgglessSelected
                          ? egglessTextWithHomeDeliveryText
                          : homeDeliveryText}
                        {isCakeAccessoriesToBeDisplayed && cakeAccessories}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </main>
          ) : !isContentToBeDisplayed && !isDevideIdFetched ? (
            <div className="verifying-device">Verifying Device..!</div>
          ) : (
            <div className="restricted-device">
              Your Device is Restricted...!
            </div>
          )}
          {!isContentToBeDisplayed && isDevideIdFetched ? (
            <a
              className="device-id"
              onClick={async () => {
                await Clipboard.write({
                  string: deviceId,
                });
                toast.success("Copied to clipboard!", {
                  id: "clipboard",
                });
              }}
            >
              Device ID
            </a>
          ) : null}
        </>
      </IonContent>
    </IonPage>
  );
};

export default Home;
