const fs = require('fs');
let code = fs.readFileSync('src/components/AccountingModule.tsx', 'utf-8');

const startMarker = '{/* Schedule VIII Balance Sheet T-Ledger Grid */}';
const endMarker = '{/* Audit Certificate & Signatures */}';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Markers not found!");
    process.exit(1);
}

const newBalanceSheet = `          {/* Schedule VIII Balance Sheet Tally Prime Style */}
          <div className="border border-slate-400 bg-white dark:bg-slate-900 shadow-sm font-sans mb-8">
            {/* Tally Header */}
            <div className="bg-[#295c7a] dark:bg-slate-800 text-white p-2 flex justify-between items-center text-sm font-bold border-b border-slate-400">
              <div className="text-center w-full leading-tight">
                Balance Sheet<br/>
                <span className="text-xs font-normal">as at 31-Mar-2027</span>
              </div>
            </div>
            
            {/* Columns Header */}
            <div className="flex border-b border-slate-400 text-[12px] font-bold bg-[#eef3f7] dark:bg-slate-800/80 text-[#002b49] dark:text-slate-200">
              <div className="w-1/2 flex justify-between p-1.5 px-3 border-r border-slate-400">
                <span>Liabilities</span>
                <span>Amount</span>
              </div>
              <div className="w-1/2 flex justify-between p-1.5 px-3">
                <span>Assets</span>
                <span>Amount</span>
              </div>
            </div>
            
            {/* Body */}
            <div className="flex text-[12px] text-slate-900 dark:text-slate-200 min-h-[250px]">
              {/* Liabilities Side */}
              <div className="w-1/2 border-r border-slate-400 p-0 flex flex-col justify-between">
                 <div className="p-2 space-y-2">
                    <div className="font-bold flex justify-between">
                       <span>Capital Account</span>
                       <span></span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-700 dark:text-slate-300">
                       <span>Opening Balance</span>
                       <span>{(initialTrustFund - openingStockValue).toLocaleString('en-IN')}</span>
                    </div>
                    {openingStockValue > 0 && (
                      <div className="pl-4 flex justify-between text-slate-700 dark:text-slate-300">
                         <span>Add: Opening Inventory Stock</span>
                         <span>{openingStockValue.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="pl-4 flex justify-between text-slate-700 dark:text-slate-300">
                       <span>Add: Current Year Surplus</span>
                       <span>{(totalIncome - totalExpense).toLocaleString('en-IN')}</span>
                    </div>
                    {closingStockValue - openingStockValue !== 0 && (
                      <div className="pl-4 flex justify-between text-slate-700 dark:text-slate-300">
                         <span>Add/Less: Stock Adjustments</span>
                         <span>{(closingStockValue - openingStockValue).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="pl-4 flex justify-between font-bold border-t border-slate-300 dark:border-slate-700 pt-1 mt-1">
                       <span>Total Capital Fund</span>
                       <span>{totalCapitalFundBalance.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="font-bold flex justify-between mt-4">
                       <span>Reserves & Surplus</span>
                       <span>0</span>
                    </div>
                    <div className="font-bold flex justify-between mt-2">
                       <span>Current Liabilities</span>
                       <span>0</span>
                    </div>
                 </div>
              </div>

              {/* Assets Side */}
              <div className="w-1/2 p-0 flex flex-col justify-between">
                 <div className="p-2 space-y-2">
                    <div className="font-bold flex justify-between">
                       <span>Fixed Assets</span>
                       <span>{totalAssetVal.toLocaleString('en-IN')}</span>
                    </div>
                    {assets.length > 0 && assets.map((a, idx) => (
                      <div key={idx} className="pl-4 flex justify-between text-slate-700 dark:text-slate-300">
                         <span>{a.nameGuj}</span>
                         <span>{a.currentValue.toLocaleString('en-IN')}</span>
                      </div>
                    ))}

                    <div className="font-bold flex justify-between mt-4">
                       <span>Current Assets</span>
                       <span>{(closingStockValue + totalBankBalance + finalCash).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pl-4 flex justify-between text-slate-700 dark:text-slate-300">
                       <span>Closing Stock</span>
                       <span>{closingStockValue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pl-4 font-bold mt-1">
                       <span>Bank Accounts</span>
                    </div>
                    {banks.map((b, idx) => (
                      <div key={idx} className="pl-8 flex justify-between text-slate-700 dark:text-slate-300">
                         <span>{b.bankNameGuj}</span>
                         <span>{b.balance.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="pl-4 font-bold mt-1">
                       <span>Cash-in-Hand</span>
                    </div>
                    <div className="pl-8 flex justify-between text-slate-700 dark:text-slate-300">
                       <span>Cash</span>
                       <span>{finalCash.toLocaleString('en-IN')}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Total Footer */}
            <div className="flex border-t border-b-2 border-slate-500 font-bold text-[13px] bg-[#eef3f7] dark:bg-slate-800 text-[#002b49] dark:text-slate-200">
              <div className="w-1/2 flex justify-between p-2 px-3 border-r border-slate-400">
                <span>Total</span>
                <span>{totalLiabilities.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-1/2 flex justify-between p-2 px-3">
                <span>Total</span>
                <span>{totalAssets.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          `;

const finalCode = code.substring(0, startIndex) + newBalanceSheet + code.substring(endIndex);
fs.writeFileSync('src/components/AccountingModule.tsx', finalCode);
console.log("Replaced successfully!");
