import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { ethers } from "ethers";
import "react-toastify/dist/ReactToastify.css";

import Beer from "./images/beer.png";

import Image from "next/image"
import Head from "next/head";
import abi from "../utils/BeerPortal.json";

export default function Home() {
  const contractAddress = "0xC4801414F58312DD0b5dBDDe68427c7d73d3Dfb0";

  const contractABI = abi.abi;

  const [currentAccount, setCurrentAccount] = useState("");

  const [message, setMessage] = useState("");

  const [name, setName] = useState("");

  const [allBeer, setAllBeer] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        setCurrentAccount(account);
        toast.success("🍺 Wallet is Connected", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        toast.warn("Make sure your MetaMask Connected", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      toast.error(`${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        toast.warn("Make sure your MetaMask Connected", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const buyBeer = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const beerPortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await beerPortalContract.getTotalBeer();
        console.log("Retrieved total beer count...", count.toNumber());

        const beerTxn = await beerPortalContract.buyBeer(
          message ? message : "Enjoy Your Beer",
          name ? name : "Anonymous",
          ethers.utils.parseEther("0.001"), //before changing this value you must change the value in the Smart contract
          {
            gasLimit: 300000,
          }
        );
        console.log("Mining...", beerTxn.hash);

        toast.info("Sending Fund for beer...", {
          position: "top-left",
          autoClose: 18050,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        await beerTxn.wait();

        console.log("Mined -- ", beerTxn.hash);

        count = await beerPortalContract.getTotalBeer();

        console.log("Retrieved total beer count...", count.toNumber());

        setMessage("");
        setName("");

        toast.success("Beer Purchased!", {
          position: "top-left",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      toast.error(`${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const getAllBeer = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const beerPortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const beers = await beerPortalContract.getAllBeer();

        const beerCleaned = beers.map((beer) => {
          return {
            address: beer.giver,
            timestamp: new Date(beer.timestamp * 1000),
            message: beer.message,
            name: beer.name,
          };
        });

        setAllBeer(beerCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let beerPortalContract;
    getAllBeer();
    checkIfWalletIsConnected();

    const onNewBeer = (from, timestamp, message, name) => {
      console.log("NewBeer", from, timestamp, message, name);
      setAllBeer((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
          name: name,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      beerPortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      beerPortalContract.on("NewBeer", onNewBeer);
    }

    return () => {
      if (beerPortalContract) {
        beerPortalContract.off("NewBeer", onNewBeer);
      }
    };
  }, []);

  const handleOnMessageChange = (event) => {
    const { value } = event.target;
    setMessage(value);
  };
  const handleOnNameChange = (event) => {
    const { value } = event.target;
    setName(value);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-zinc-900">
      <Head>
        <title>Buy Me a Beer</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-yellow-500 mb-6">
          Buy Me A Beer
        </h1>
        <div className="BeerImage">
            <Image src={Beer} alt="beer" />
        </div>

        {currentAccount ? (
          <div className="w-full max-w-xs sticky top-3 z-50 ">
            <form className="bg-yellow-500 shadow-md rounded px-8 pt-6 pb-8 mb-4">
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="name"
                  type="text"
                  placeholder="Name"
                  onChange={handleOnNameChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="message"
                >
                  Send the Developer a Message
                </label>

                <textarea
                  className="form-textarea mt-1 block w-full shadow appearance-none py-2 px-3 border rounded text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                  placeholder="Message"
                  id="message"
                  onChange={handleOnMessageChange}
                  required
                ></textarea>
              </div>

              <div className="flex items-left justify-between">
                <button
                  className="bg-black hover:bg-black text-center text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="button"
                  onClick={buyBeer}
                >
                  Donate $ETH
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <p className="text-2xl text-yellow-500 mb-6">
              You can switch your wallet to Rinkeby Testnet Network to test this
              application.
            </p>
            <button
              className="bg-yellow-500 hover:bg-yellow-700 text-black font-bold py-2 px-3 rounded-full mt-3"
              onClick={connectWallet}
            >
              Connect Your Wallet
            </button>
          </div>
        )}

        {allBeer.map((beer, index) => {
          return (
            <div className="border-l-2 mt-10" key={index}>
              <div className="transform transition cursor-pointer hover:-translate-y-2 ml-10 relative flex items-center px-6 py-4 bg-yellow-500 text-black rounded mb-10 flex-col md:flex-row space-y-4 md:space-y-0">
                {/* <!-- The dot next to the box --> */}
                <div className="w-5 h-5 bg-yellow-500 absolute -left-10 transform -translate-x-2/4 rounded-full z-10 mt-2 md:mt-0"></div>

                {/* <!-- Line connecting to the box --> */}
                <div className="w-10 h-1 bg-green-300 absolute -left-10 z-0"></div>

                {/* <!-- Box Content --> */}
                <div className="flex-auto">
                  <h1 className="text-md">Supporter: {beer.name}</h1>
                  <h1 className="text-md">Message: {beer.message}</h1>
                  <h3>Address: {beer.address}</h3>
                  <h1 className="text-md font-bold">
                    TimeStamp: {beer.timestamp.toString()}
                  </h1>
                </div>
              </div>
            </div>
          );
        })}
      </main>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}