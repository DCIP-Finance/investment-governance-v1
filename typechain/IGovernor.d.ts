/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface IGovernorInterface extends ethers.utils.Interface {
  functions: {
    "castVote(uint256,bool)": FunctionFragment;
    "propose(string,string,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "castVote",
    values: [BigNumberish, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "propose",
    values: [string, string, BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "castVote", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "propose", data: BytesLike): Result;

  events: {
    "ProposalCreated(uint256,string,uint256)": EventFragment;
    "VoteCast(address,uint256,bool,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "ProposalCreated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "VoteCast"): EventFragment;
}

export class IGovernor extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: IGovernorInterface;

  functions: {
    castVote(
      proposalId: BigNumberish,
      support: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    propose(
      title: string,
      description: string,
      fundAllocation: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  castVote(
    proposalId: BigNumberish,
    support: boolean,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  propose(
    title: string,
    description: string,
    fundAllocation: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    castVote(
      proposalId: BigNumberish,
      support: boolean,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    propose(
      title: string,
      description: string,
      fundAllocation: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {
    ProposalCreated(
      id?: null,
      title?: null,
      fundAllocation?: null
    ): TypedEventFilter<
      [BigNumber, string, BigNumber],
      { id: BigNumber; title: string; fundAllocation: BigNumber }
    >;

    VoteCast(
      account?: null,
      proposalId?: null,
      support?: null,
      weight?: null
    ): TypedEventFilter<
      [string, BigNumber, boolean, BigNumber],
      {
        account: string;
        proposalId: BigNumber;
        support: boolean;
        weight: BigNumber;
      }
    >;
  };

  estimateGas: {
    castVote(
      proposalId: BigNumberish,
      support: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    propose(
      title: string,
      description: string,
      fundAllocation: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    castVote(
      proposalId: BigNumberish,
      support: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    propose(
      title: string,
      description: string,
      fundAllocation: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}